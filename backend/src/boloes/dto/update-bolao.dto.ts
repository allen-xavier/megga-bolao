import { PartialType } from '@nestjs/mapped-types';
import { CreateBolaoDto } from './create-bolao.dto';

export class UpdateBolaoDto extends PartialType(CreateBolaoDto) {}
