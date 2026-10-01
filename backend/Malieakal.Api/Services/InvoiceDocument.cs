using Malieakal.Domain.Entities;
using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Linq;

namespace Malieakal.Api.Services
{
    public class InvoiceDocument : IDocument
    {
        private readonly Order _order;
        private readonly Address _address;

        public InvoiceDocument(Order order)
        {
            _order = order;
            // Use ShippingAddress or fallback
            _address = order.ShippingAddress ?? new Address();
        }

        public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            container
                .Page(page =>
                {
                    page.Margin(50);
                    page.Size(PageSizes.A4);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Lato"));

                    page.Header().Element(ComposeHeader);
                    page.Content().Element(ComposeContent);
                    page.Footer().Element(ComposeFooter);
                });
        }

        private void ComposeHeader(IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("MALIEAKAL ELECTRONICS").FontSize(24).SemiBold().FontColor(Colors.Blue.Darken2);
                    column.Item().Text("123 Commerce Street, Ernakulam, Kerala");
                    column.Item().Text("Phone: +91 9876543210 | Email: support@malieakal.com");
                    column.Item().Text("GSTIN: 32AABCU9603R1ZM").Bold();
                });

                row.ConstantItem(150).Column(column =>
                {
                    column.Item().Text("TAX INVOICE").FontSize(20).Bold().FontColor(Colors.Grey.Darken3).AlignRight();
                    column.Item().Text($"Invoice #: INV-{_order.OrderNumber}").AlignRight();
                    column.Item().Text($"Date: {DateTime.UtcNow:dd MMM yyyy}").AlignRight();
                    column.Item().Text($"Order Date: {_order.CreatedAt:dd MMM yyyy}").AlignRight();
                });
            });
        }

        private void ComposeContent(IContainer container)
        {
            container.PaddingVertical(1, Unit.Centimetre).Column(column =>
            {
                column.Item().Row(row =>
                {
                    row.RelativeItem().Component(new AddressComponent("Billing Address", _address, _order));
                    row.ConstantItem(50);
                    row.RelativeItem().Component(new AddressComponent("Shipping Address", _address, _order));
                });

                column.Item().PaddingTop(25).Element(ComposeTable);
                column.Item().PaddingTop(15).Element(ComposeSummary);
            });
        }

        private void ComposeTable(IContainer container)
        {
            container.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(30);  // Sl No
                    columns.RelativeColumn(3);   // Description
                    columns.RelativeColumn();    // Unit Price
                    columns.ConstantColumn(50);  // Quantity
                    columns.RelativeColumn();    // Item Discount
                    columns.RelativeColumn();    // Total Price
                });

                table.Header(header =>
                {
                    header.Cell().Element(CellStyle).Text("Sl.");
                    header.Cell().Element(CellStyle).Text("Product Description");
                    header.Cell().Element(CellStyle).AlignRight().Text("Unit Price");
                    header.Cell().Element(CellStyle).AlignRight().Text("Qty");
                    header.Cell().Element(CellStyle).AlignRight().Text("Discount");
                    header.Cell().Element(CellStyle).AlignRight().Text("Total");

                    static IContainer CellStyle(IContainer container)
                    {
                        return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                    }
                });

                var slNo = 1;
                foreach (var item in _order.Items)
                {
                    table.Cell().Element(CellStyle).Text(slNo.ToString());
                    table.Cell().Element(CellStyle).Text(item.ProductName);
                    table.Cell().Element(CellStyle).AlignRight().Text($"Rs {item.Price:N2}");
                    table.Cell().Element(CellStyle).AlignRight().Text(item.Quantity.ToString());
                    table.Cell().Element(CellStyle).AlignRight().Text("-");
                    table.Cell().Element(CellStyle).AlignRight().Text($"Rs {(item.Price * item.Quantity):N2}");

                    static IContainer CellStyle(IContainer container)
                    {
                        return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                    }
                    slNo++;
                }
            });
        }

        private void ComposeSummary(IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("Payment Method: " + _order.PaymentMethod).SemiBold();
                    column.Item().Text("Payment Status: " + (_order.PaymentInfo?.Status ?? "N/A"));
                });

                row.RelativeItem().Column(column =>
                {
                    column.Item().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).Row(r =>
                    {
                        r.RelativeItem().Text("Subtotal:");
                        r.RelativeItem().AlignRight().Text($"Rs {_order.SubTotal:N2}");
                    });

                    if (_order.Discount > 0)
                    {
                        column.Item().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).Row(r =>
                        {
                            r.RelativeItem().Text("Discount on MRP:");
                            r.RelativeItem().AlignRight().Text($"- Rs {_order.Discount:N2}");
                        });
                    }

                    if (_order.PromoDiscount > 0)
                    {
                        column.Item().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).Row(r =>
                        {
                            r.RelativeItem().Text($"Coupon Discount ({_order.PromoCode}):");
                            r.RelativeItem().AlignRight().Text($"- Rs {_order.PromoDiscount:N2}");
                        });
                    }

                    column.Item().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).Row(r =>
                    {
                        r.RelativeItem().Text("Shipping Charges:");
                        r.RelativeItem().AlignRight().Text(_order.ShippingCharges > 0 ? $"Rs {_order.ShippingCharges:N2}" : "Free");
                    });

                    column.Item().PaddingTop(5).Row(r =>
                    {
                        r.RelativeItem().Text("Grand Total:").SemiBold().FontSize(12);
                        r.RelativeItem().AlignRight().Text($"Rs {_order.TotalAmount:N2}").SemiBold().FontSize(12);
                    });
                });
            });
        }

        private void ComposeFooter(IContainer container)
        {
            container.Column(column =>
            {
                column.Item().PaddingBottom(20).Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Text("Return Policy:").SemiBold();
                        c.Item().Text("Items can be returned within 7 days of delivery. Terms & Conditions apply.");
                    });
                    row.RelativeItem().AlignRight().Column(c =>
                    {
                        c.Item().Text("Authorized Signatory").SemiBold().AlignRight();
                        c.Item().PaddingTop(20).Text("____________________").AlignRight();
                    });
                });

                column.Item().AlignCenter().Text(x =>
                {
                    x.Span("Thank you for shopping with ");
                    x.Span("Malieakal!").SemiBold();
                });
                column.Item().AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        }
    }

    public class AddressComponent : IComponent
    {
        private readonly string _title;
        private readonly Address _address;
        private readonly Order _order;

        public AddressComponent(string title, Address address, Order order)
        {
            _title = title;
            _address = address;
            _order = order;
        }

        public void Compose(IContainer container)
        {
            container.Column(column =>
            {
                column.Item().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(5).Text(_title).SemiBold().FontSize(11);
                
                // Construct address cleanly
                var name = !string.IsNullOrWhiteSpace(_address.FullName) ? _address.FullName : "Customer";
                var phone = !string.IsNullOrWhiteSpace(_address.Phone) ? _address.Phone : string.Empty;
                var email = !string.IsNullOrWhiteSpace(_address.Email) ? _address.Email : _order.EmailAddress;

                column.Item().PaddingTop(5).Text(name).SemiBold();
                if (!string.IsNullOrWhiteSpace(_address.AddressLine1))
                    column.Item().Text(_address.AddressLine1);
                if (!string.IsNullOrWhiteSpace(_address.AddressLine2))
                    column.Item().Text(_address.AddressLine2);
                if (!string.IsNullOrWhiteSpace(_address.City))
                    column.Item().Text($"{_address.City}, {_address.State} - {_address.Pincode}");
                if (!string.IsNullOrWhiteSpace(phone))
                    column.Item().Text($"Phone: {phone}");
                if (!string.IsNullOrWhiteSpace(email))
                    column.Item().Text($"Email: {email}");
            });
        }
    }
}
