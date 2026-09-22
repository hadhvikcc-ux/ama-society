import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('popular')
  async getPopularTags(@Query('societyId') societyId: string) {
    return this.tagsService.getPopularTags(societyId);
  }

  @Get('analytics')
  @Roles('ADMIN')
  async getTagAnalytics(
    @Query('societyId') societyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.tagsService.getTagAnalytics(societyId, new Date(startDate), new Date(endDate));
  }

  @Get('vendor-failures')
  @Roles('ADMIN')
  async getVendorFailureReport(@Query('societyId') societyId: string) {
    return this.tagsService.getVendorFailureReport(societyId);
  }

  @Get(':tag/timeline')
  async getTagTimeline(
    @Param('tag') tag: string,
    @Query('societyId') societyId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ) {
    return this.tagsService.getTagTimeline(tag, societyId, page, limit);
  }
}
