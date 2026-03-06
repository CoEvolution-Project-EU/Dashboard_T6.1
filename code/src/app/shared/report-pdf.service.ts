import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


@Injectable({
  providedIn: 'root'
})

export class ReportPdfService {

  constructor() { }

  promises = []



  async exportHtml(elements, assetID, preconfView) {

    const doc = new jsPDF();
    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.text("Case Report: " + assetID, 105, 20, null, "center");
    doc.text("Preconfigured View: " + preconfView, 105, 28, null, "center");

    doc.setFontSize(12);
    doc.text(new Date(Date.now()).toLocaleString(), 105, 35, null, "center");

    doc.addImage("assets/logo/logo.png", "PNG", 90, 40, 30, 30, null, 'FAST');


    elements.forEach((widgets, i) => {

      const promise = new Promise<void>((resolve, reject) => {

        html2canvas(widgets.element, { scale: 2 }).then(canvas => {

          doc.addPage()
          doc.setPage(widgets.options.pagenum)

          // title
          doc.setFont("times", "italic");
          doc.setFontSize(16);
          doc.setTextColor("#3e536d");
          doc.text(widgets.options.title, 20, 20);

          // description
          doc.setFont("times", "normal");
          doc.setFontSize(12);
          doc.setTextColor("black");
          doc.text(widgets.options.description, 20, 30, { maxWidth: 170 });

          //content of the widget
          widgets.element.nativeElement = canvas.toDataURL(widgets.options.name + '/png');
          let widgetimage = canvas.toDataURL(widgets.options.name + '/png', 1.0);

          let pageWidth = doc.internal.pageSize.getWidth(); // get width of PDF page
          let pageHeight = doc.internal.pageSize.getHeight(); // get height of PDF page

          let maxImageWidth = pageWidth - 30; // maximum width of image on page
          let maxImageHeight = pageHeight - 30; // maximum height of image on page

          let naturalWidth = widgets.element.offsetWidth;
          let naturalHeight = widgets.element.offsetHeight;

          let scale = 1; // scale factor for image

          if (naturalWidth > maxImageWidth || naturalHeight > maxImageHeight) {

            // calculate scale factor to fit image on page
            let widthScale = maxImageWidth / naturalWidth;
            let heightScale = maxImageHeight / naturalHeight;
            scale = Math.min(widthScale, heightScale);

          }

          let scaledWidth = naturalWidth * scale; // scaled width of image
          let scaledHeight = naturalHeight * scale; // scaled height of image
          let x = (pageWidth - scaledWidth) / 2; // horizontal position for image
          // ensure x and y values are not negative
          x = Math.max(0, x);
          doc.addImage(widgetimage, 'PNG', x, 45, scaledWidth, scaledHeight, null, 'FAST');
          doc.setFontSize(8);
          doc.setTextColor("black");

          // footer
          doc.setFont("times", "italic");
          doc.setFontSize(12);
          doc.setTextColor("black");
          doc.text(widgets.options.pagenum.toLocaleString(), 105, 290, null, "center");


          resolve()

        }, (error) => {

          reject()

        });

      })

      this.promises.push(promise)


    });



    try {

      Promise.all(this.promises).then((values) => {
        doc.save(assetID + "_" + preconfView + "_report.pdf");
      })

    } catch (error) {

      console.error('Error generating PDF:', error);

    }


  }

}
