import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './confirmation-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ConfirmationDialogComponent>>;

  const mockDialogData: ConfirmationDialogData = {
    title: 'Test Title',
    message: 'Test Message',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  };

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ConfirmationDialogComponent
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display dialog title and message', () => {
    const titleElement = fixture.nativeElement.querySelector('h2');
    const messageElement = fixture.nativeElement.querySelector('p');

    expect(titleElement.textContent).toContain(mockDialogData.title);
    expect(messageElement.textContent).toContain(mockDialogData.message);
  });

  it('should have confirm and cancel buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');

    expect(buttons[0].textContent).toContain(mockDialogData.cancelText);
    expect(buttons[1].textContent).toContain(mockDialogData.confirmText);
  });

  it('should close dialog with true when confirm clicked', () => {
    const confirmButton = fixture.nativeElement.querySelectorAll('button')[1];
    confirmButton.click();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close dialog with undefined when cancel clicked', () => {
    const cancelButton = fixture.nativeElement.querySelectorAll('button')[0];
    cancelButton.click();

    expect(dialogRef.close).toHaveBeenCalled();
  });
});
