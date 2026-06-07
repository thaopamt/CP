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

async function run() {
  console.log('🚀 Starting Automated Seed Script for BASIC B...');

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

  // 2. Seed Class "BASIC B"
  const classCode = 'BASIC-B';
  let basicBClass = await classRepo.findOneBy({ code: classCode });

  if (!basicBClass) {
    basicBClass = new ClassEntity();
    basicBClass.name = 'BASIC B';
    basicBClass.code = classCode;
    basicBClass.description = 'Lớp học lập trình thi đấu trung cấp B. Tập trung vào mảng cộng dồn, tiền tố, hậu tố nâng cao, cặp và các kỹ năng sắp xếp.';
    basicBClass.enrolledCount = 0;
    basicBClass.status = ClassStatus.ACTIVE;
    basicBClass = await classRepo.save(basicBClass);
    console.log('✅ Class "BASIC B" created.');
  } else {
    console.log('ℹ️ Class "BASIC B" already exists.');
  }

  // 3. Preload existing BASIC-B courses & assignments so we can UPSERT in place.
  // Updating rows by their stable natural key (course.code / assignment.slug)
  // preserves their primary keys — and therefore every student submission, which
  // references assignments via an ON DELETE CASCADE FK. Only content that has
  // disappeared from disk is deleted at the end (see the cleanup after the loop).
  console.log('🔎 Loading existing BASIC-B courses & assignments for upsert...');
  const existingCourses = await courseRepo.createQueryBuilder('course')
    .where("course.code LIKE 'BASIC-B-%'")
    .getMany();
  const courseByCode = new Map(existingCourses.map((c) => [c.code, c]));

  const existingAssignments = await assignmentRepo.createQueryBuilder('a')
    .where("a.slug LIKE 'basicb-%'")
    .getMany();
  const assignmentBySlug = new Map(existingAssignments.map((a) => [a.slug as string, a]));

  const seededCourseCodes = new Set<string>();
  const seededSlugs = new Set<string>();

  // 4. Read the Topic folders dynamically
  const baseDir = path.join(process.cwd(), 'database/BASIC_B');
  if (!fs.existsSync(baseDir)) {
    console.error(`❌ Base directory not found: ${baseDir}`);
    await AppDataSource.destroy();
    process.exit(1);
  }

  const topicFolders = fs.readdirSync(baseDir)
    .filter(name => {
      const fullPath = path.join(baseDir, name);
      return fs.statSync(fullPath).isDirectory() && !name.startsWith('.');
    });
  topicFolders.sort();

  console.log(`📂 Found ${topicFolders.length} topic folders to process.`);

  for (let t = 0; t < topicFolders.length; t++) {
    const folderName = topicFolders[t];
    const topicIndex = t + 1;
    const topicPath = path.join(baseDir, folderName);

    // Create Course for this topic
    const courseCode = `BASIC-B-0${topicIndex}`;
    const courseTitle = folderName.replace('_', ':');

    console.log(`📖 Processing Topic ${topicIndex}: ${courseTitle}`);

    // Upsert the course by its stable `code` so its id (and the submissions that
    // hang off its assignments) survive reseeds.
    const course = courseByCode.get(courseCode) ?? new Course();
    course.code = courseCode;
    course.title = courseTitle;
    course.description = `Chuyên đề số ${topicIndex} thuộc lộ trình đào tạo lập trình BASIC B.`;
    course.status = PublishStatus.PUBLISHED;
    course.assignmentCount = 0;
    course.totalPoints = 0;

    const savedCourse = await courseRepo.save(course);
    seededCourseCodes.add(courseCode);

    // Link Course to Class (upsert on the unique (classId, courseId) pair).
    let classCourseLink = await classCourseRepo.findOne({
      where: { classId: basicBClass.id, courseId: savedCourse.id },
    });
    if (!classCourseLink) classCourseLink = new ClassCourse();
    classCourseLink.classId = basicBClass.id;
    classCourseLink.courseId = savedCourse.id;
    classCourseLink.orderIndex = topicIndex;
    classCourseLink.isRequired = true;
    await classCourseRepo.save(classCourseLink);

    // Read all files in the topic folder
    const allFiles = fs.readdirSync(topicPath);
    const mdFiles = allFiles.filter(f => f.endsWith('.md')).sort();

    let coursePointsSum = 0;
    let courseAssignmentCount = 0;

    for (let a = 0; a < mdFiles.length; a++) {
      const mdFile = mdFiles[a];
      const problemName = mdFile.replace('.md', '');
      const mdFilePath = path.join(topicPath, mdFile);
      const zipFilePath = path.join(topicPath, `${problemName}.zip`);

      const mdContent = fs.readFileSync(mdFilePath, 'utf-8');
      const lines = mdContent.split('\n');

      // Extract title
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
        
        // Format Yêu cầu, Input, Output, Note, Scoring to highlight and render correctly
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

      // Extract prefix for slug (e.g. "A", "B", "C")
      const prefixMatch = problemName.match(/^([a-zA-Z0-9]+)\./);
      const prefix = prefixMatch ? prefixMatch[1].toLowerCase() : problemName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const slug = `basicb-0${topicIndex}-${prefix}`;

      // Difficulty & points assignment
      const isHard = /nâng cao|độ đẹp|bộ ba số|ghép đội|gcd|đắp núi/i.test(problemName) || /nâng cao|hard|expert|advanced/i.test(title);
      const difficulty = isHard ? ('HARD' as const) : ('MEDIUM' as const);
      const points = isHard ? 30 : 20;

      console.log(`  📝 Seeding Assignment: ${title} [${difficulty} - ${points} pts] (slug: ${slug})`);

      const testCases: any[] = [];

      if (fs.existsSync(zipFilePath)) {
        // Unzip and parse test cases using JSZip
        const zipBuffer = fs.readFileSync(zipFilePath);
        const zip = await JSZip.loadAsync(zipBuffer);
        const zipFileNames = Object.keys(zip.files);

        const inpFiles = zipFileNames.filter(name => name.endsWith('.inp')).sort((x, y) => {
          const numX = parseInt(x.replace(/\D/g, ''), 10) || 0;
          const numY = parseInt(y.replace(/\D/g, ''), 10) || 0;
          return numX - numY;
        });

        const cappedInpFiles = inpFiles.slice(0, 10);

        for (let i = 0; i < cappedInpFiles.length; i++) {
          const inpFile = cappedInpFiles[i];
          const outFile = inpFile.replace('.inp', '.out');

          let matchedOutFile = zipFileNames.find(name => name.toLowerCase() === outFile.toLowerCase());

          if (matchedOutFile) {
            const inputContent = await zip.files[inpFile].async('text');
            const outputContent = await zip.files[matchedOutFile].async('text');
            const isHidden = i >= 3;

            testCases.push({
              input: inputContent,
              output: outputContent,
              isHidden
            });
          }
        }
        console.log(`    📊 Loaded ${testCases.length} testcases from zip.`);
      } else {
        // Parse from Markdown Example section
        const exampleIndex = lines.findIndex(line => line.toLowerCase().includes('### example'));
        if (exampleIndex !== -1) {
          for (let i = exampleIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('|') && !line.toLowerCase().includes('input') && !line.includes(':---')) {
              const parts = line.split('|').map(p => p.trim()).filter(p => p !== '');
              if (parts.length >= 2) {
                const rawInput = parts[0].replace(/<br>/gi, '\n');
                const rawOutput = parts[1].replace(/<br>/gi, '\n');
                testCases.push({
                  input: rawInput,
                  output: rawOutput,
                  isHidden: false
                });
              }
            }
          }
        }
        console.log(`    📊 Parsed ${testCases.length} public testcases from markdown Example table.`);
      }

      // Upsert the assignment by its stable `slug`. Reusing the existing row keeps
      // its id, so every student submission against it is preserved on reseed.
      const assignment = assignmentBySlug.get(slug) ?? new Assignment();
      assignment.title = title;
      assignment.description = description;
      assignment.difficulty = difficulty;
      assignment.points = points;
      assignment.estimatedMinutes = isHard ? 45 : 30;
      assignment.slug = slug;
      assignment.tags = ['basics-b', folderName.replace(/^\d+\.\s*/, '').toLowerCase()];
      assignment.codingConfig = {
        timeLimit: 1,
        memoryLimit: 1024,
        checkerType: 'exact' as const,
        allowedLanguages: ['cpp', 'python', 'java', 'javascript'],
        testCases
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

    // Recount and update Course denormalized fields
    savedCourse.assignmentCount = courseAssignmentCount;
    savedCourse.totalPoints = coursePointsSum;
    await courseRepo.save(savedCourse);

    console.log(`✅ Topic ${topicIndex} seeding completed with ${courseAssignmentCount} assignments, total ${coursePointsSum} points.`);
  }

  // Remove ONLY content that disappeared from disk. Removing an assignment cascades
  // just THAT assignment's submissions (intentional — the problem no longer exists);
  // everything still on disk kept its id above, so its submissions are untouched.
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

  console.log('🎉 BASIC B Seeding Completed Successfully! Content synced; student submissions preserved.');
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('❌ Error during BASIC B seed:', err);
  process.exit(1);
});
