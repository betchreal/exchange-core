import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class StaffRefreshGuard extends AuthGuard('jwt-staff-refresh') {}
