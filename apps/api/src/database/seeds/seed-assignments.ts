import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Assignment } from '../../modules/assignments/assignment.entity';
import { AssignmentType, PublishStatus } from '@cp/shared';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'cp',
  password: process.env.DB_PASSWORD || 'cp',
  database: process.env.DB_NAME || 'cp',
  entities: [Assignment],
  synchronize: false,
});

const sampleAssignments = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    description: `## Problem Statement
Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

## Constraints
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- **Only one valid answer exists.**
`,
    type: AssignmentType.CODING,
    difficulty: 'EASY',
    subject: 'Algorithms',
    points: 10,
    tags: ['Array', 'Hash Table'],
    status: PublishStatus.PUBLISHED,
    codingConfig: {
      timeLimit: 1.0,
      memoryLimit: 256,
      outputLimit: 10,
      checkerType: 'standard',
      allowedLanguages: ['C++ 20', 'Java 17', 'Python 3', 'JavaScript'],
      testCases: [
        {
          input: '4\n2 7 11 15\n9',
          output: '0 1',
          explanation: 'Because nums[0] + nums[1] == 9, we return 0 1.',
          isHidden: false,
        },
        {
          input: '3\n3 2 4\n6',
          output: '1 2',
          isHidden: false,
        },
        {
          input: '2\n3 3\n6',
          output: '0 1',
          isHidden: true,
        }
      ]
    }
  },
  {
    title: 'Longest Palindromic Substring',
    slug: 'longest-palindromic-substring',
    description: `## Problem Statement
Given a string \`s\`, return the longest palindromic substring in \`s\`.

## Constraints
- \`1 <= s.length <= 1000\`
- \`s\` consist of only digits and English letters.
`,
    type: AssignmentType.CODING,
    difficulty: 'MEDIUM',
    subject: 'Algorithms',
    points: 20,
    tags: ['String', 'Dynamic Programming'],
    status: PublishStatus.PUBLISHED,
    codingConfig: {
      timeLimit: 2.0,
      memoryLimit: 512,
      outputLimit: 10,
      checkerType: 'standard',
      allowedLanguages: ['C++ 20', 'Java 17', 'Python 3'],
      testCases: [
        {
          input: 'babad',
          output: 'bab',
          explanation: '"aba" is also a valid answer.',
          isHidden: false,
        },
        {
          input: 'cbbd',
          output: 'bb',
          isHidden: false,
        },
        {
          input: 'a',
          output: 'a',
          isHidden: true,
        }
      ]
    }
  },
  {
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    description: `## Problem Statement
Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return the median of the two sorted arrays.

The overall run time complexity should be \`O(log (m+n))\`.

## Constraints
- \`nums1.length == m\`
- \`nums2.length == n\`
- \`0 <= m <= 1000\`
- \`0 <= n <= 1000\`
- \`1 <= m + n <= 2000\`
`,
    type: AssignmentType.CODING,
    difficulty: 'HARD',
    subject: 'Algorithms',
    points: 40,
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    status: PublishStatus.PUBLISHED,
    codingConfig: {
      timeLimit: 3.0,
      memoryLimit: 256,
      outputLimit: 10,
      checkerType: 'standard',
      allowedLanguages: ['C++ 20', 'Java 17', 'Python 3', 'JavaScript'],
      testCases: [
        {
          input: '2\n1 3\n1\n2',
          output: '2.00000',
          explanation: 'merged array = [1,2,3] and median is 2.',
          isHidden: false,
        },
        {
          input: '2\n1 2\n2\n3 4',
          output: '2.50000',
          explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.',
          isHidden: false,
        }
      ]
    }
  }
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('Connected!');

    const assignmentRepo = AppDataSource.getRepository(Assignment);

    console.log('Clearing existing assignments...');
    await AppDataSource.query('TRUNCATE TABLE assignments CASCADE');

    console.log('Inserting sample assignments...');
    for (const data of sampleAssignments) {
      const assignment = assignmentRepo.create(data as any);
      await assignmentRepo.save(assignment);
      console.log(`- Created assignment: ${assignment}`);
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
