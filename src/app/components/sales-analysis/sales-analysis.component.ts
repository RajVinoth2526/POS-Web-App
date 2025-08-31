import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ApiResponse, Cart, Filter } from 'src/app/model/system.model';
import { OrderService } from 'src/app/service/order.service';
import { SystemService } from 'src/app/service/system.service';
import { Subject, takeUntil } from 'rxjs';
// import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

interface SalesData {
  date: string;
  totalSales: number;
  orderCount: number;
}

interface ProductSalesData {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

@Component({
  selector: 'app-sales-analysis',
  templateUrl: './sales-analysis.component.html',
  styleUrls: ['./sales-analysis.component.css']
})
export class SalesAnalysisComponent implements OnInit, OnDestroy {
  // Date range properties
  startDate: string = '';
  endDate: string = '';
  
  // Sales data
  totalSales: number = 0;
  totalOrders: number = 0;
  averageOrderValue: number = 0;
  
  // Chart data
  salesChartData: any = {
    labels: [],
    datasets: []
  };
  salesChartOptions: any = {};
  productSalesData: ProductSalesData[] = [];
  
  // Orders data
  orders: Cart[] = [];
  currency: string = '';
  
  // Loading states
  isLoading: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private spinnerService: NgxSpinnerService,
    private systemService: SystemService
  ) { }

  ngOnInit(): void {
    this.currency = this.systemService.getCurrencyValue() ?? '';
    
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    this.endDate = endDate.toISOString().split('T')[0];
    this.startDate = startDate.toISOString().split('T')[0];
    
    // Load initial data
    this.loadSalesAnalysis();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDateRangeChange(): void {
    if (this.startDate && this.endDate) {
      this.loadSalesAnalysis();
    }
  }

  loadSalesAnalysis(): void {
    if (!this.startDate || !this.endDate) {
      return;
    }

    this.isLoading = true;
    this.spinnerService.show();

    // Create filter for date range
    const filter: Filter = {
      pageNumber: 1,
      pageSize: 1000, // Get all orders for analysis
      name: '',
      orderStartDate: `${this.startDate}T00:00:00.000Z`,
      orderEndDate: `${this.endDate}T23:59:59.999Z`
    };

    this.orderService.getAllOrders(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ApiResponse<Cart[]>) => {
          this.orders = response.data ?? [];
          this.calculateSalesMetrics();
          this.generateChartData();
          this.calculateProductSales();
          this.isLoading = false;
          this.spinnerService.hide();
        },
        error: (error) => {
          console.error('Error loading sales analysis:', error);
          this.isLoading = false;
          this.spinnerService.hide();
        }
      });
  }

  private calculateSalesMetrics(): void {
    this.totalSales = this.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    this.totalOrders = this.orders.length;
    this.averageOrderValue = this.totalOrders > 0 ? this.totalSales / this.totalOrders : 0;
  }

  private generateChartData(): void {
    // Group orders by date
    const salesByDate: { [key: string]: SalesData } = {};
    
    this.orders.forEach(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      
      if (!salesByDate[orderDate]) {
        salesByDate[orderDate] = {
          date: orderDate,
          totalSales: 0,
          orderCount: 0
        };
      }
      
      salesByDate[orderDate].totalSales += order.totalAmount || 0;
      salesByDate[orderDate].orderCount += 1;
    });

    // Convert to arrays for chart
    const dates = Object.keys(salesByDate).sort();
    const sales = dates.map(date => salesByDate[date].totalSales);
    const orderCounts = dates.map(date => salesByDate[date].orderCount);

    this.salesChartData = {
      labels: dates.map(date => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: `Sales Amount (${this.currency})`,
          data: sales,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(75, 192, 192)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        },
        {
          label: 'Order Count',
          data: orderCounts,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.4,
          fill: false,
          yAxisID: 'y1',
          pointBackgroundColor: 'rgb(255, 99, 132)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    };

    this.salesChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          grid: {
            display: true,
            color: 'rgba(0,0,0,0.1)'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: `Sales Amount (${this.currency})`,
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          grid: {
            display: true,
            color: 'rgba(0,0,0,0.1)'
          },
          ticks: {
            callback: function(value: any) {
              return this.currency + value.toLocaleString();
            }.bind(this)
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Order Count',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            stepSize: 1
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        title: {
          display: true,
          text: `Sales Analysis: ${this.startDate} to ${this.endDate}`,
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: 20
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: function(context: any) {
              return `Date: ${context[0].label}`;
            },
            label: function(context: any) {
              if (context.datasetIndex === 0) {
                return `Sales: ${this.currency}${context.parsed.y.toLocaleString()}`;
              } else {
                return `Orders: ${context.parsed.y}`;
              }
            }.bind(this),
            afterLabel: function(context: any) {
              if (context.datasetIndex === 0) {
                const avgOrderValue = context.parsed.y / (salesByDate[dates[context.dataIndex]]?.orderCount || 1);
                return `Avg Order Value: ${this.currency}${avgOrderValue.toFixed(2)}`;
              }
              return '';
            }.bind(this)
          }
        }
      }
    };
  }

  private calculateProductSales(): void {
    const productSales: { [key: string]: ProductSalesData } = {};
    
    this.orders.forEach(order => {
      order.orderItems?.forEach(item => {
        const productId = item.productId || item.product.id;
        const productName = item.name;
        
        if (!productSales[productId]) {
          productSales[productId] = {
            productId: productId,
            productName: productName,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0
          };
        }
        
        productSales[productId].totalQuantity += item.quantity;
        productSales[productId].totalRevenue += item.total;
        productSales[productId].orderCount += 1;
      });
    });

    // Convert to array and sort by revenue
    this.productSalesData = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  getFilteredOrders(): Cart[] {
    // Return orders that are already filtered by date range in loadSalesAnalysis()
    return this.orders;
  }

  getDateRangeFilter(): Filter {
    return {
      pageNumber: 1,
      pageSize: 1000,
      name: '',
      orderStartDate: `${this.startDate}T00:00:00.000Z`,
      orderEndDate: `${this.endDate}T23:59:59.999Z`
    };
  }

  getDailySalesData(): any[] {
    const salesByDate: { [key: string]: any } = {};
    
    this.orders.forEach(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      
      if (!salesByDate[orderDate]) {
        salesByDate[orderDate] = {
          date: orderDate,
          totalSales: 0,
          orderCount: 0,
          products: {}
        };
      }
      
      salesByDate[orderDate].totalSales += order.totalAmount || 0;
      salesByDate[orderDate].orderCount += 1;
      
      // Track products for this day
      if (order.orderItems) {
        order.orderItems.forEach(item => {
          if (!salesByDate[orderDate].products[item.name]) {
            salesByDate[orderDate].products[item.name] = 0;
          }
          salesByDate[orderDate].products[item.name] += item.quantity || 0;
        });
      }
    });

    // Convert to array and calculate additional metrics
    return Object.keys(salesByDate)
      .sort()
      .map(date => {
        const dayData = salesByDate[date];
        const averageOrderValue = dayData.orderCount > 0 ? dayData.totalSales / dayData.orderCount : 0;
        
        // Find top product for this day
        const topProduct = Object.keys(dayData.products).reduce((a, b) => 
          dayData.products[a] > dayData.products[b] ? a : b, 'N/A'
        );
        
        return {
          date: new Date(date),
          totalSales: dayData.totalSales,
          orderCount: dayData.orderCount,
          averageOrderValue: averageOrderValue,
          topProduct: topProduct
        };
      });
  }

  getRevenuePercentage(productRevenue: number): number {
    if (this.totalSales === 0) return 0;
    return (productRevenue / this.totalSales) * 100;
  }

  getProgressBarClass(index: number): string {
    const classes = ['bg-success', 'bg-info', 'bg-warning', 'bg-danger', 'bg-primary'];
    return classes[index % classes.length];
  }

  getTopSellingProduct(): string {
    if (this.productSalesData.length === 0) return 'N/A';
    return this.productSalesData[0].productName;
  }

  getTotalProductsSold(): number {
    return this.productSalesData.reduce((sum, product) => sum + product.totalQuantity, 0);
  }
}