import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { hashPassword } from 'src/utils/hash';
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, phoneNumber, password } = registerUserDto;
    try {
      if (!email || !name || !password) {
        throw new BadRequestException('Fill all required info');
      }
      const hashedPassword = await hashPassword(password);
      const newUser = await this.prisma.user.create({
        data: { email, name, password: hashedPassword, phoneNumber },
      });
      return newUser;
    } catch (e) {
      console.error(e);
      return { error: e };
    }
  }
}
