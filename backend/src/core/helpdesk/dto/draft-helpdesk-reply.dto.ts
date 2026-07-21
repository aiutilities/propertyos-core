import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DraftHelpdeskReplyDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  ticketId!: string;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  customerMessage!: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;
}
