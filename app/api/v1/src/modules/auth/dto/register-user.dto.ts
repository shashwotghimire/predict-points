import { IsEmail, IsString, IsOptional } from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  profilePicUrl: string;

  @IsOptional()
  @IsString()
  phoneNumber: string;
}
