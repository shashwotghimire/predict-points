import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name } = registerUserDto;
    try {
      const newUser = await this.prisma.user.create({ data: { email, name } });
      return newUser;
    } catch (e) {
      console.error(e);
      return { error: e };
    }
  }
}
