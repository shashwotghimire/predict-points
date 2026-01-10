import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    try {
      return this.authService.registerUser({
        email: registerUserDto.email,
        name: registerUserDto.name,
      });
    } catch (e) {
      return { error: e };
    }
  }
}
