import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(key: string) {
    return this.prisma.policy.findUnique({ where: { key } });
  }

  async upsert(key: string, title: string, content: string) {
    return this.prisma.policy.upsert({
      where: { key },
      update: { title, content },
      create: { key, title, content },
    });
  }
}
