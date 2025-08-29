import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Product } from '../../model/system.model';
import { ProductService } from '../../service/product.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute } from '@angular/router';
import { EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ImageUploadService } from 'src/app/firebase/common-service/image-upload.service';
@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css'],
})
export class AddProductComponent implements OnInit {
  productForm!: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;
  isDragging = false;
  productId: string | null = null;
  availableUnits: { value: string; label: string }[] = [];
  fileExtension: string = '';
  selectedFileFireBase: any;
  imageFirebaseUrl: string = '';
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  unitTypes = [
    { value: 'volume', label: 'Volume' },
    { value: 'weight', label: 'Weight' }
  ];

  unitOptions = {
    volume: [
      { value: 'l', label: 'Liters' },
      { value: 'ml', label: 'Milliliters' }
    ],
    weight: [
      { value: 'kg', label: 'Kilograms' },
      { value: 'g', label: 'Grams' },
      { value: 'lb', label: 'Pounds' }
    ]
  };

  constructor(private productService: ProductService,
    private tosterService: ToastrService,
    private route: ActivatedRoute,
    private spinnerService: NgxSpinnerService,
    private imageUploadService: ImageUploadService
  ) { }

  ngOnInit(): void {
    // Initialize the form with empty/default values
    this.productForm = new FormGroup({
      name: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
      price: new FormControl('', [Validators.required, Validators.min(1)]),
      sku: new FormControl(''),
      barcode: new FormControl(''),
      category: new FormControl(''),
      stockQuantity: new FormControl(''),
      unitType: new FormControl(''),
      unit: new FormControl(''),
      unitValue: new FormControl(''),
      taxRate: new FormControl(''),
      isAvailable: new FormControl(true),
      manufactureDate: new FormControl(''),
      expiryDate: new FormControl(''),
      image: new FormControl(null),
      isPartialAllowed: new FormControl(false)
    });

    // Check for optional route param "id" and load product if present
    this.route.paramMap
      .pipe(
        switchMap(params => {
          this.productId = params.get('id') ? params.get('id') : '';
          return this.productId ? this.productService.getProduct(this.productId) : EMPTY;
        })
      )
      .subscribe((response) => {
        // Patch form values with the fetched product data'
        if (response.data) {
          let product: Product = response.data;
          this.imagePreview = product.image ?? null;
          this.imageFirebaseUrl = product.image ?? '';
          this.productForm.patchValue({
            name: product.name,
            description: product.description,
            price: product.price,
            sku: product.sku,
            barcode: product.barcode,
            category: product.category,
            stockQuantity: product.stockQuantity,
            unitType: product.unitType,
            unit: product.unit,
            unitValue: product.unitValue,
            taxRate: product.taxRate,
            isAvailable: product.isAvailable,
            isPartialAllowed: product.isPartialAllowed,
            manufactureDate: product.manufactureDate
              ? new Date(product.manufactureDate).toISOString().split('T')[0]
              : null,
            expiryDate: product.expiryDate
              ? new Date(product.expiryDate).toISOString().split('T')[0]
              : null,
            image: product.image
          });
        }
        this.onUnitTypeChange();
      });
  }

  isImageUrl(url: string): boolean {
    // Regular expression to check if the URL starts with "http" or "https"
    const httpRegex = /^https?:\/\//i;

    // Regular expression to check if the URL ends with image file extensions
    const imageRegex = /\.(jpg|jpeg|png|gif|bmp|svg)(\?.*)?$/i;  // Modified to allow query parameters

    // Check if the URL is HTTP(S) and ends with an image extension
    return httpRegex.test(url) && imageRegex.test(url);
  }




  async onSubmit() {
    if (this.productForm.valid) {
      if (environment.systemMode == 1) {
        this.spinnerService.show();
        if (this.selectedFileFireBase) {
          this.imagePreview = await this.imageUploadService.uploadImage(this.selectedFileFireBase);
        }

        if (this.selectedFileFireBase && this.productForm.value.image && this.productForm.value.image != '' && this.isImageUrl(this.productForm.value.image)) {
          await this.imageUploadService.deleteImage(this.productForm.value.image);
        }
        this.productForm.patchValue({
          image: this.imagePreview, // Update form with the image preview
        });
        this.spinnerService.hide();
      }
      const product: Product = {
        ...this.productForm.value,
        lowerCaseName: this.productForm.value.name.toLowerCase(),
        //Assuming you want to store the image URL
      };

      const nullableFields = [
        'taxRate',
        'sku',
        'barcode',
        'category',
        'unit',
        'manufactureDate',
        'expiryDate',
        'unitType',
        'unitValue',
        'stockQuantity'
      ] as const;

      type NullableField = typeof nullableFields[number];

      nullableFields.forEach((field: NullableField) => {
        if (product[field] === '') {
          (product as any)[field] = null;
        }
      });

      if (this.productId) {
        this.spinnerService.show();
        this.productService.updateProduct(this.productId, product).subscribe((response) => {

          if (response.success && response.data) {
            this.productForm.patchValue({
              ...response.data,
              manufactureDate: response.data.manufactureDate
                ? new Date(product.manufactureDate ?? '').toISOString().split('T')[0]
                : null,
              expiryDate: response.data.expiryDate
                ? new Date(product.expiryDate ?? '').toISOString().split('T')[0]
                : null,
            });
            this.spinnerService.hide();
            this.tosterService.success('Product updated successfully!', 'Success');
          } else {
            this.spinnerService.hide();
            this.tosterService.error('Failed to add product.', 'Error');
          }
        },
          (error) => {
            this.tosterService.error('Failed to add product.', 'Error');
          }

        );
      } else {
        this.spinnerService.show();
        this.productService.addProduct(product).subscribe(
          (response) => {
            this.tosterService.success('Product added successfully!', 'Success');
            this.spinnerService.hide();
            this.productForm.reset();
            this.productForm?.get('isAvailable')?.setValue(true);
            this.productForm?.get('isPartialAllowed')?.setValue(false);

          },
          (error) => {
            this.tosterService.error('Failed to add product.', 'Error');
          }
        );
      }

    } else {
      this.productForm.markAllAsTouched(); // Force error messages to display
      this.tosterService.error('Please fill all required fields.', 'Error');
    }
  }

  onFileChange(event: any) {
    const file = event.target.files?.[0];
    this.handleFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    const file = event.dataTransfer?.files?.[0];
    this.handleFile(file);
  }

  async handleFile(file: File | undefined) {
    if (!file) return;
    this.fileExtension = file.name.split('.').pop() || '';
    if (!['jpg', 'jpeg', 'png'].includes(this.fileExtension)) {
      this.tosterService.error('Invalid file type. Please upload an image.', 'Error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      this.tosterService.error('File size exceeds 2MB limit.', 'Error');
      return;
    }

    this.selectedFileFireBase = file; // Keep the original file for Firebase
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result;
      this.productForm.patchValue({ image: this.imagePreview });
    };
    reader.readAsDataURL(file); // OK for preview only
  }

  removeImage() {
    this.imagePreview = null;
    this.productForm.get('image')?.reset(); // Optional, if you use a form control for image
  }

  // ViewChild to reference the input

  triggerFileSelect() {
    this.fileInput.nativeElement.click();
  }

  onPartialAllowedChange(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
  
    const unitTypeControl = this.productForm.get('unitType');
    if (isChecked) {
     unitTypeControl?.setValidators([Validators.required]);
    } else {
     unitTypeControl?.clearValidators();
    }
    
    // ⚠️ Important: Update value and validity
   unitTypeControl?.updateValueAndValidity();
  }
  

  onUnitTypeChange(): void {
    const selectedType = this.productForm.get('unitType')?.value as keyof typeof this.unitOptions;
    this.availableUnits = this.unitOptions[selectedType] || [];

    const unitControl = this.productForm.get('unit');
    const unitValueControl = this.productForm.get('unitValue');
    if (selectedType) {
      unitControl?.setValidators([Validators.required]);
      unitValueControl?.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      unitControl?.clearValidators();
      unitValueControl?.clearValidators();
    }

    // ⚠️ Important: Update value and validity
    unitControl?.updateValueAndValidity();
    unitValueControl?.updateValueAndValidity();

    unitControl?.updateValueAndValidity();
    unitValueControl?.updateValueAndValidity();

  }


}

