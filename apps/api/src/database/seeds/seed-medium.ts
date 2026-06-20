import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import JSZip from 'jszip';
import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/user.entity';
import { ClassEntity } from '../../modules/classes/class.entity';
import { Course } from '../../modules/courses/course.entity';
import { Assignment } from '../../modules/assignments/assignment.entity';
import { ClassCourse } from '../../modules/classes/class-course.entity';
import { CourseAssignment } from '../../modules/courses/course-assignment.entity';
import { ClassStatus, PublishStatus } from '@cp/shared';

// Toàn bộ 30 bài nằm trong MỘT chuyên đề (một course). Mức độ tăng dần theo số
// thứ tự bài: 1-10 Dễ (prefix/suffix cơ bản), 11-25 Trung bình (kết hợp, truy
// vấn, điều kiện), 26-30 Nâng cao (subarray, 2D, hashmap).
function difficultyForIndex(idx: number): { difficulty: 'EASY' | 'MEDIUM' | 'HARD'; points: number; minutes: number } {
  if (idx <= 10) return { difficulty: 'EASY', points: 15, minutes: 20 };
  if (idx <= 25) return { difficulty: 'MEDIUM', points: 20, minutes: 30 };
  return { difficulty: 'HARD', points: 30, minutes: 45 };
}

async function run() {
  console.log('🚀 Starting Automated Seed Script for MEDIUM (Prefix/Suffix)...');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('📂 Database connected.');
  }

  const userRepo = AppDataSource.getRepository(User);
  const classRepo = AppDataSource.getRepository(ClassEntity);
  const courseRepo = AppDataSource.getRepository(Course);
  const assignmentRepo = AppDataSource.getRepository(Assignment);
  const classCourseRepo = AppDataSource.getRepository(ClassCourse);
  const courseAssignmentRepo = AppDataSource.getRepository(CourseAssignment);

  // 1. Fetch Admin User
  const adminEmail = 'admin@zenith.local';
  const admin = await userRepo.findOneBy({ email: adminEmail });
  if (!admin) {
    console.error('❌ Admin user Zenith not found! Please run the seed-admin script first.');
    await AppDataSource.destroy();
    process.exit(1);
  }

  // 2. Seed Class "MEDIUM"
  const classCode = 'MEDIUM';
  let mediumClass = await classRepo.findOneBy({ code: classCode });
  if (!mediumClass) {
    mediumClass = new ClassEntity();
    mediumClass.name = 'MEDIUM';
    mediumClass.code = classCode;
    mediumClass.description = 'Lớp học lập trình thi đấu trung cấp. Chuyên sâu kỹ thuật Tiền tố - Hậu tố (prefix sum, suffix sum, mảng hiệu, prefix 2D).';
    mediumClass.enrolledCount = 0;
    mediumClass.status = ClassStatus.ACTIVE;
    mediumClass = await classRepo.save(mediumClass);
    console.log('✅ Class "MEDIUM" created.');
  } else {
    console.log('ℹ️ Class "MEDIUM" already exists.');
  }

  // 3. Preload existing MEDIUM courses & assignments so we can UPSERT in place,
  // preserving primary keys (and therefore student submissions). Only content
  // that disappeared from disk is deleted after the loop.
  console.log('🔎 Loading existing MEDIUM courses & assignments for upsert...');
  const existingCourses = await courseRepo.createQueryBuilder('course')
    .where("course.code LIKE 'MEDIUM-%'")
    .getMany();
  const courseByCode = new Map(existingCourses.map((c) => [c.code, c]));

  const existingAssignments = await assignmentRepo.createQueryBuilder('a')
    .where("a.slug LIKE 'medium-%'")
    .getMany();
  const assignmentBySlug = new Map(existingAssignments.map((a) => [a.slug as string, a]));

  const seededCourseCodes = new Set<string>();
  const seededSlugs = new Set<string>();

  // 4. Read the Topic folders dynamically (only folders prefixed with two digits,
  // e.g. "01. Chuyên đề: ..."; this skips _solutions/, GIAO_TRINH.md, .DS_Store).
  const baseDir = path.join(process.cwd(), 'database/MEDIUM');
  if (!fs.existsSync(baseDir)) {
    console.error(`❌ Base directory not found: ${baseDir}`);
    await AppDataSource.destroy();
    process.exit(1);
  }

  const topicFolders = fs.readdirSync(baseDir)
    .filter((name) => {
      const fullPath = path.join(baseDir, name);
      return fs.statSync(fullPath).isDirectory() && /^\d{2}\./.test(name);
    });
  topicFolders.sort();

  console.log(`📂 Found ${topicFolders.length} topic folders to process.`);

  for (let t = 0; t < topicFolders.length; t++) {
    const folderName = topicFolders[t];
    const topicIndex = t + 1;
    const topicPath = path.join(baseDir, folderName);

    const courseCode = `MEDIUM-0${topicIndex}`;
    const courseTitle = folderName.replace('_', ':');

    console.log(`📖 Processing Topic ${topicIndex}: ${courseTitle}`);

    const course = courseByCode.get(courseCode) ?? new Course();
    course.code = courseCode;
    course.title = courseTitle;
    course.description = 'Chuyên đề Tiền tố - Hậu tố (MEDIUM): 30 bài từ prefix/suffix cơ bản đến mảng hiệu, prefix 2D và ứng dụng subarray.';
    course.status = PublishStatus.PUBLISHED;
    course.assignmentCount = 0;
    course.totalPoints = 0;

    const savedCourse = await courseRepo.save(course);
    seededCourseCodes.add(courseCode);

    // Link Course to Class (upsert on the unique (classId, courseId) pair).
    let classCourseLink = await classCourseRepo.findOne({
      where: { classId: mediumClass.id, courseId: savedCourse.id },
    });
    if (!classCourseLink) classCourseLink = new ClassCourse();
    classCourseLink.classId = mediumClass.id;
    classCourseLink.courseId = savedCourse.id;
    classCourseLink.orderIndex = topicIndex;
    classCourseLink.isRequired = true;
    await classCourseRepo.save(classCourseLink);

    const allFiles = fs.readdirSync(topicPath);
    const mdFiles = allFiles.filter((f) => f.endsWith('.md')).sort();

    let coursePointsSum = 0;
    let courseAssignmentCount = 0;

    for (let a = 0; a < mdFiles.length; a++) {
      const mdFile = mdFiles[a];
      const problemName = mdFile.replace('.md', '');
      const mdFilePath = path.join(topicPath, mdFile);
      const zipFilePath = path.join(topicPath, `${problemName}.zip`);

      const mdContent = fs.readFileSync(mdFilePath, 'utf-8');
      const lines = mdContent.split('\n');

      // Extract title from the first "# ..." heading
      let title = problemName;
      if (lines[0] && lines[0].startsWith('# ')) {
        title = lines[0].replace('# ', '').trim();
      }

      const cleanLines: string[] = [];
      let skipMode = false;
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const lowerLine = line.trim().toLowerCase();

        if (i === 0 && line.startsWith('# ')) continue;
        if (lowerLine.includes('time limit per test')) continue;
        if (lowerLine.includes('memory limit per test')) continue;
        if (lowerLine.includes('đề bài') && line.startsWith('#')) continue;

        if (lowerLine.startsWith('### example') || lowerLine.startsWith('### ví dụ')) {
          skipMode = true;
          continue;
        }

        if (skipMode) {
          if (line.startsWith('#')) {
            skipMode = false;
          } else {
            continue;
          }
        }

        if (lowerLine === '### input' || lowerLine === 'input' || lowerLine === '**input**') {
          line = '\n**Input**\n';
        } else if (lowerLine === '### output' || lowerLine === 'output' || lowerLine === '**output**') {
          line = '\n**Output**\n';
        } else if (lowerLine === '### note' || lowerLine === 'note' || lowerLine === '**note**' || lowerLine === '### chú thích') {
          line = '\n**Note**\n';
        } else if (lowerLine === '### scoring' || lowerLine === 'scoring' || lowerLine === '**scoring**') {
          line = '\n**Scoring**\n';
        } else if (lowerLine.startsWith('yêu cầu:') || lowerLine.startsWith('**yêu cầu:**')) {
          if (!line.includes('**')) {
            line = line.replace(/Yêu cầu:/i, '**Yêu cầu:**');
          }
          line = '\n' + line + '\n';
        }

        cleanLines.push(line);
      }

      const description = cleanLines.join('\n').trim();

      // Slug prefix from the problem letter (A, B, C, ...)
      const prefixMatch = problemName.match(/^([a-zA-Z0-9]+)\./);
      const prefix = prefixMatch ? prefixMatch[1].toLowerCase() : problemName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const slug = `medium-0${topicIndex}-${prefix}`;

      const { difficulty, points, minutes } = difficultyForIndex(a + 1);

      console.log(`  📝 Seeding Assignment: ${title} [${difficulty} - ${points} pts] (slug: ${slug})`);

      const testCases: any[] = [];

      if (fs.existsSync(zipFilePath)) {
        const zipBuffer = fs.readFileSync(zipFilePath);
        const zip = await JSZip.loadAsync(zipBuffer);
        const zipFileNames = Object.keys(zip.files);

        const inpFiles = zipFileNames.filter((name) => name.endsWith('.inp')).sort((x, y) => {
          const numX = parseInt(x.replace(/\D/g, ''), 10) || 0;
          const numY = parseInt(y.replace(/\D/g, ''), 10) || 0;
          return numX - numY;
        });

        const cappedInpFiles = inpFiles.slice(0, 10);

        for (let i = 0; i < cappedInpFiles.length; i++) {
          const inpFile = cappedInpFiles[i];
          const outFile = inpFile.replace('.inp', '.out');
          const matchedOutFile = zipFileNames.find((name) => name.toLowerCase() === outFile.toLowerCase());

          if (matchedOutFile) {
            const inputContent = await zip.files[inpFile].async('text');
            const outputContent = await zip.files[matchedOutFile].async('text');
            const isHidden = i >= 3; // 3 test đầu công khai, còn lại ẩn
            testCases.push({ input: inputContent, output: outputContent, isHidden });
          }
        }
        console.log(`    📊 Loaded ${testCases.length} testcases from zip.`);
      } else {
        console.warn(`    ⚠️ No zip found for ${problemName}; assignment will have 0 testcases.`);
      }

      // Upsert the assignment by its stable `slug` so submissions survive reseeds.
      const assignment = assignmentBySlug.get(slug) ?? new Assignment();
      assignment.title = title;
      assignment.description = description;
      assignment.difficulty = difficulty;
      assignment.points = points;
      assignment.estimatedMinutes = minutes;
      assignment.slug = slug;
      assignment.tags = ['medium', 'prefix-suffix', folderName.replace(/^\d+\.\s*/, '').toLowerCase()];
      assignment.codingConfig = {
        timeLimit: 1,
        memoryLimit: 1024,
        checkerType: 'exact' as const,
        allowedLanguages: ['cpp', 'python', 'java', 'javascript'],
        testCases,
      };
      assignment.status = PublishStatus.PUBLISHED;

      const savedAssignment = await assignmentRepo.save(assignment);
      seededSlugs.add(slug);

      // Link Assignment to Course (upsert on the unique (courseId, assignmentId) pair).
      let courseAssignmentLink = await courseAssignmentRepo.findOne({
        where: { courseId: savedCourse.id, assignmentId: savedAssignment.id },
      });
      if (!courseAssignmentLink) courseAssignmentLink = new CourseAssignment();
      courseAssignmentLink.courseId = savedCourse.id;
      courseAssignmentLink.assignmentId = savedAssignment.id;
      courseAssignmentLink.orderIndex = a + 1;
      courseAssignmentLink.prerequisiteAssignmentId = null;
      await courseAssignmentRepo.save(courseAssignmentLink);

      coursePointsSum += points;
      courseAssignmentCount++;
    }

    savedCourse.assignmentCount = courseAssignmentCount;
    savedCourse.totalPoints = coursePointsSum;
    await courseRepo.save(savedCourse);

    console.log(`✅ Topic ${topicIndex} seeding completed with ${courseAssignmentCount} assignments, total ${coursePointsSum} points.`);
  }

  // Remove ONLY content that disappeared from disk (cascades just that
  // assignment's submissions). Everything still on disk kept its id above.
  const obsoleteAssignments = existingAssignments.filter((a) => !seededSlugs.has(a.slug as string));
  if (obsoleteAssignments.length) {
    await assignmentRepo.remove(obsoleteAssignments);
    console.log(`🗑️ Removed ${obsoleteAssignments.length} obsolete assignments (no longer on disk).`);
  }
  const obsoleteCourses = existingCourses.filter((c) => !seededCourseCodes.has(c.code));
  if (obsoleteCourses.length) {
    await courseRepo.remove(obsoleteCourses);
    console.log(`🗑️ Removed ${obsoleteCourses.length} obsolete courses (no longer on disk).`);
  }

  console.log('🎉 MEDIUM Seeding Completed Successfully! Content synced; student submissions preserved.');
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('❌ Error during MEDIUM seed:', err);
  process.exit(1);
});
