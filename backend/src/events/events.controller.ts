import { Controller, Sse, UseGuards } from "@nestjs/common";
import { Observable, map } from "rxjs";
import { EventsService, AppEvent } from "./events.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Sse()
  @UseGuards(JwtAuthGuard)
  stream(): Observable<{ data: AppEvent }> {
    return this.events.stream().pipe(map((event) => ({ data: event })));
  }
}
