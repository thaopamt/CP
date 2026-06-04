import { Module } from '@nestjs/common';

import { TestcaseStorageService } from './testcase-storage.service';

@Module({
  providers: [TestcaseStorageService],
  exports: [TestcaseStorageService],
})
export class TestcasesModule {}
