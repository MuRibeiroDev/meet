import { Controller, Post, Body } from '@nestjs/common';
import { PasswordService } from './password.service';
import { ForgotPasswordDto, VerifyCodeDto, ResetPasswordDto } from './dto/password.dto';

@Controller('password')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Post('forgot')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordService.forgotPassword(dto);
  }

  @Post('verify-code')
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.passwordService.verifyCode(dto);
  }

  @Post('reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordService.resetPassword(dto);
  }
}
