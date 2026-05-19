import { Module } from '@nestjs/common';
import { LiveMonitorGateway } from './live-monitor.gateway';

@Module({
  providers: [LiveMonitorGateway],
})
export class LiveMonitorModule {}
