import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExpandableDetailsService {

  private converItemDate(dateString: string) {
    const dateParts = dateString.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);
    const dateObject = new Date(year, month, day);
    const milliseconds = dateObject.getTime();

    return milliseconds;
  }

  public createData_expandableDetails(data) {
    // console.log(data, 'IN SERVICE')
    if (!Array.isArray(data) || data.length == 0) {
      return ['noData'];
    }
    const mainData = [...data[0].orders];
    const flattenedOrders = mainData.map(order => {

      if (!order.orderof || order.orderof.length === 0) {
        return new Error('no data')
      }
      const orderofItem = order.orderof[0];
      const composedby = [...order.composedby];
      let frameCount = 0;
      let blockCount = 0;
      composedby.forEach(item => {

        switch (item.type) {
          case 'Frame':
            frameCount++;
            break;
          case 'Block':
            blockCount++;
            break;
        }
      });

      composedby.forEach(item => {
        const currentDate = Date.now();
        const itemDateMs = this.converItemDate(item.expectedDeliveryDate);
        if (itemDateMs >= currentDate) {
          item.status = 'On Time';
        } else {
          item.status = 'Delayed';
        }
      })

      return {
        ...order,
        comments: `Order of: ${order.orderof[0].quantity} ${order.orderof[0].type},
                   Composed by: ${frameCount} Frame - ${blockCount} Blocks`,
        ...orderofItem
      };
    });

    const finalFlattenedOrders = flattenedOrders.map(({ orderof, ...rest }) => rest);
    return finalFlattenedOrders;
  }

  public createColumns_expandableDetails(data) {

    if (data.length == 0) {
      return ['noData'];
    }
    const columns = Object.keys(data[0]).filter(key => key != 'composedby');
    return columns;
  }

  public createNestedColumns_expandableDetails(data) {
    if (data.length == 0) {
      return ['noData'];
    }
    const nestedTableColumns = Object.keys(data[0].composedby[0]);
    // nestedTableColumns.push('status')
    return nestedTableColumns;
  }
}