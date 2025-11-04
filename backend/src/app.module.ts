import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { SalasModule } from './salas/salas.module';
import { AgendamentosModule } from './agendamentos/agendamentos.module';
import { SalaDisplayModule } from './sala-display/sala-display.module';
import { PasswordModule } from './password/password.module';
import { HealthController } from './health.controller';
import { Usuario } from './entities/usuario.entity';
import { Sala } from './entities/sala.entity';
import { Agendamento } from './entities/agendamento.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: parseInt(configService.get('DB_PORT')),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [Usuario, Sala, Agendamento],
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
        timezone: '-03:00',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsuariosModule,
    SalasModule,
    AgendamentosModule,
    SalaDisplayModule,
    PasswordModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
