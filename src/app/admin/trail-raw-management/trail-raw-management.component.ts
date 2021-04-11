import { Component, OnDestroy, OnInit } from '@angular/core';
import { TrailPreview, TrailPreviewService } from 'src/app/trail-preview-service.service';
import { NgbPagination } from "@ng-bootstrap/ng-bootstrap";
import { DateUtils } from 'src/app/utils/DateUtils';
import { ImportService, TrailRawResponse } from 'src/app/import.service';
import { Subject } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";
import { Router } from '@angular/router';
import { TrailRawService } from 'src/app/trail-raw-service.service';

@Component({
  selector: 'app-trail-raw-management',
  templateUrl: './trail-raw-management.component.html',
  styleUrls: ['./trail-raw-management.component.scss']
})
export class TrailRawManagementComponent implements OnInit, OnDestroy {

  public entryPerPage = 10
  public page: number;

  public trailRawList: TrailPreview[]
  public totalRaw: number;

  public isLoading = false;

  private destroy$ = new Subject();

  constructor(
    private trailRawService: TrailRawService,
    private importService: ImportService,
    private trailPreviewService: TrailPreviewService,
    private router: Router
  ) { }

  delete(id: string) {
    alert("gonna remove " + id);
    // this.trailRawService.
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  ngOnInit(): void {
    this.loadRawTrails(1);
  }

  getTrailRawPreviews(skip: number, limit: number) {
    this.trailPreviewService.getRawPreviews(skip, limit).subscribe(preview => {
      this.totalRaw = preview.totalCount;
      this.trailRawList = preview.content;
    });
  }

  loadRawTrails(page: number): void {
    this.page = page;
    const lowerBound = this.entryPerPage * (page - 1);
    this.getTrailRawPreviews(lowerBound, this.entryPerPage);
  }

  uploadFile(file: FileList): void {
    this.isLoading = true;
    console.log(file);
    this.importService
      .readTrail(file[0])
      .pipe(takeUntil(this.destroy$))
      .subscribe((trailRawResponse: TrailRawResponse) => {
        this.isLoading = false;
        console.log(trailRawResponse.content[0].id);
        this.navigateToEdit(trailRawResponse.content[0].id)
      });
  }


  uploadFiles(files: FileList): void {
    this.isLoading = true;
    this.importService
      .readTrails(files)
      .pipe(takeUntil(this.destroy$))
      .subscribe((_) => {
        this.isLoading = false;
      });
  }

  public navigateToEdit(rawId: string) {
    this.router.navigate(['/admin/trail/raw/' + rawId]);
  }

  formatDate(stringDate: string) {
    return DateUtils.formatDateToDay(stringDate)
  }
}
