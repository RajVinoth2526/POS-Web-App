import { Component, OnDestroy, OnInit, Output, EventEmitter  } from '@angular/core';
import { SystemService } from 'src/app/service/system.service';
import { Profile } from '../../model/system.model';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  companyName: string = "";
  private subscriptions: Subscription[] = [];
  @Output() toggle = new EventEmitter<void>();


  constructor(private systemService: SystemService) {

   }

  ngOnInit(): void {
    const profileSubs = this.systemService.profile$.subscribe((data: Profile | null) => {
      if(data == null) {
        this.companyName = environment.companyName;
      } else {
        this.companyName = data.businessName;
      }
    });
    this.subscriptions.push(profileSubs);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleSidebar() {
    this.toggle.emit();
  }

}
