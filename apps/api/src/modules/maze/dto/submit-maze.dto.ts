import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Command, ISubmitMazePayload } from '@cp/shared';

export class SubmitMazeDto implements ISubmitMazePayload {
  @IsUUID('4')
  levelId!: string;

  @IsString()
  workspaceXml!: string;

  /**
   * The parsed command tree. Shape/contents are authoritatively re-validated by
   * `validateCommands` in the service before grading — we only assert it's an
   * array here.
   */
  @IsArray()
  commandTree!: Command[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(0x7fffffff)
  randomSeed?: number;
}
