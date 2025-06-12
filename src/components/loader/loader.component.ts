import { Component } from '@angular/core';
import { LoaderService } from '../../service/loader/loader.service';
import { CommonModule } from '@angular/common';

import { OnInit } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-loader',
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements OnInit {
      isLoading: Observable<boolean> | undefined;

      constructor(private loaderService: LoaderService) {}

      ngOnInit() {
        this.isLoading = this.loaderService.loading$;
      }
}
