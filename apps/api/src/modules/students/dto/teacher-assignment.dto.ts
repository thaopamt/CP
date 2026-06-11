import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetStudentTeachersDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  teacherIds!: string[];
}

export class SetTeacherStudentsDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  studentIds!: string[];
}
