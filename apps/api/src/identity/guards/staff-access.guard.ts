import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class StaffAccessGuard extends AuthGuard('jwt-staff-access') {}
