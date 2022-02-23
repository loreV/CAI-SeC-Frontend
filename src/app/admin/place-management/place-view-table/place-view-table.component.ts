import {Component, OnInit} from '@angular/core';
import {PlaceDto, PlaceService} from "../../../service/place.service";
import {environment} from "../../../../environments/environment.prod";
import {DateUtils} from "../../../utils/DateUtils";
import {TrailDto, TrailService} from "../../../service/trail-service.service";
import {Marker} from "../../../map-preview/map-preview.component";
import {MapPinIconType} from "../../../../assets/icons/MapPinIconType";
import {ActivatedRoute, Router} from "@angular/router";
import {AdminPlaceService} from "../../../service/admin-place.service";
import {AuthService} from "../../../service/auth.service";
import {TrailPreviewService} from "../../../service/trail-preview-service.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {InfoModalComponent} from "../../../modal/info-modal/info-modal.component";

@Component({
    selector: 'app-place-view-table',
    templateUrl: './place-view-table.component.html',
    styleUrls: ['./place-view-table.component.scss']
})
export class PlaceViewTableComponent implements OnInit {

    placeList: PlaceDto[] = [];
    placePreview: PlaceDto;
    trailsPreview: TrailDto[] = [];
    markersPreview: Marker[] = [];

    trailMap: Map<String, String> = new Map();

    isPlacePreviewVisible = false;

    realm = "";
    entryPerPage = 10;
    totalPlaces = 0;
    selectedPage: number = 0;

    constructor(private placeService: PlaceService,
                private adminPlaceService: AdminPlaceService,
                private trailService: TrailService,
                private trailPreviewService: TrailPreviewService,
                private activatedRoute: ActivatedRoute,
                private authService: AuthService,
                private modalService: NgbModal,
                private router: Router) {
    }

    ngOnInit(): void {
        this.onPlaceLoad(1);
        this.realm = this.authService.getRealm();
        this.onLoadTrailMap();
    }

    private onPlaceLoad(page: number) {
        const electedPage = page - 1;
        this.placeService.get(electedPage * this.entryPerPage,
            (electedPage + 1) * this.entryPerPage)
            .subscribe(resp => {
                this.placeList = resp.content;
                this.totalPlaces = resp.totalCount;
                this.selectedPage = page;
            });
    }

    onEdit(id: string) {
        this.router.navigate(
            ["../edit/" + id], {
                relativeTo: this.activatedRoute,
            });
    }

    formatStringDateToDashes(uploadedOn: string) {
        return DateUtils.formatDateToDay(uploadedOn);
    }

    onPreview(placeDto: PlaceDto) {
        this.placePreview = placeDto
        this.trailsPreview = [];
        this.markersPreview = [];

        this.markersPreview = placeDto.coordinates.map(c => {
            return {
                color: "black",
                icon: MapPinIconType.PIN,
                coords: {longitude: c.longitude, latitude: c.latitude}
            }
        });
        placeDto.crossingTrailIds.forEach((trailId) => {
            this.trailService.getTrailById(trailId).subscribe((resp) => {
                resp.content.forEach((r) => this.trailsPreview.push(r));
            })
        });
        this.togglePreview();
    }

    togglePreview() {
        this.isPlacePreviewVisible = !this.isPlacePreviewVisible;
    }

    onDelete(id: string) {
        this.adminPlaceService.deleteById(id).subscribe(() => {
            this.onPlaceLoad(this.selectedPage)
        });
    }

    showTrailCode(crossingTrailIds: string[]) {
        const trails = crossingTrailIds.map(it => this.trailMap.get(it));
        const trailsHtml = trails.map((it => `<li>${it}</li>`)).join("");
        this.openError("Sentieri passanti per " + (crossingTrailIds.length > 1 ? "crocevia" : "località"),
            "<p>Sentieri:</p><ul>" + trailsHtml + "</ul>");
    }

    private onLoadTrailMap() {
        this.trailPreviewService.getMappings(this.realm)
            .subscribe((resp) => {
                resp.content.forEach(it => this.trailMap.set(it.id, it.code));
            });
    }

    private openError(title: string, body: string) {
        const modal = this.modalService.open(InfoModalComponent);
        modal.componentInstance.title = title;
        modal.componentInstance.body = body;
    }
}
