import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PrintIcon from '@mui/icons-material/Print';
import CoffeeIcon from '@mui/icons-material/Coffee';
import StarIcon from '@mui/icons-material/Star';
import { listServices, type Service } from '../api/services';
import { listProducts, type Product } from '../api/inventory';
import { createClient, listClients, type Client } from '../api/clients';
import { listEmployees, type Employee } from '../api/employees';
import {
  createInvoiceManual,
  type Invoice,
  type PaymentMethod,
} from '../api/accounting';
import { createPayment } from '../api/payments';
import { sendWhatsApp } from '../api/notifications';
import { getSettings } from '../api/settings';
import { useBranchStore } from '../stores/branchStore';
import { ZATCA_VAT_NUMBER } from '../utils/zatcaQR';
import { buildInvoiceQrPayload, generateQrImageDataUrl } from '../utils/invoiceQr';
import { barcodeSvgDataUrl } from '../utils/barcode';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'نقطة بيع سريعة',
    client: 'العميلة',
    newClient: 'عميلة جديدة',
    name: 'الاسم',
    phone: 'الهاتف',
    employee: 'الموظفة',
    selectEmployee: 'اختر الموظفة',
    paymentMethod: 'طريقة الدفع',
    cash: 'نقدي',
    card: 'بطاقة',
    wallet: 'محفظة',
    electronicPay: 'دفع إلكتروني',
    electronicPaySimulated: 'تمت محاكاة الدفع الإلكتروني',
    discount: 'الخصم',
    tax: 'الضريبة',
    taxApplicable: 'يستحق الضريبة',
    notTaxable: 'غير خاضعة للضريبة',
    employeeForAll: 'منفذة الخدمة (تطبق على الكل)',
    itemEmployee: 'منفذة الخدمة',
    loyaltyBalance: 'رصيد نقاط الولاء',
    worthValue: 'بقيمة',
    usePoints: 'استخدام',
    useAllPoints: 'استخدام الكل',
    willEarn: 'ستكسب',
    pointsUnit: 'نقطة',
    redeemValueHint: 'خصم',
    loyaltyPoints: 'نقاط الولاء',
    searchClientHint: 'ابحث بالاسم أو رقم الهاتف',
    offerCode: 'كود العرض / الكوبون',
    redeemPoints: 'نقاط للاستبدال',
    tip: 'الإكرامية',
    giftCardCode: 'كود بطاقة الهدايا',
    giftCardUsed: 'بطاقة الهدايا',
    tipLine: 'الإكرامية',
    printReceipt: 'طباعة الإيصال',
    pointsEarned: 'نقاط الولاء المكتسبة',
    services: 'خدمات',
    products: 'منتجات',
    tabCafeteria: 'كافتيريا',
    cafeteriaEmpty: 'لا توجد منتجات كافتيريا بعد — أضف منتجاً بتصنيف "كافتيريا" من شاشة المخزون',
    cafeteriaHint: 'اختر منتجاً لإضافته إلى السلة وستكمل الفاتورة كالمعتاد',
    cafeteriaQty: 'المتوفر',
    search: 'بحث...',
    allCategories: 'الكل',
    category: 'الفئة',
    price: 'السعر',
    outOfStock: 'نفد المخزون',
    cart: 'السلة',
    cartEmpty: 'السلة فارغة',
    noResults: 'لا توجد نتائج',
    remove: 'حذف',
    subtotal: 'المجموع الفرعي',
    total: 'الإجمالي',
    complete: 'إنهاء الفاتورة',
    completeHint: 'اختر العميلة والموظفة وأضف عنصراً واحداً على الأقل',
    invoiceCreated: 'تم إنشاء الفاتورة بنجاح',
    invoiceNo: 'رقم الفاتورة',
    totalPaid: 'الإجمالي',
    sendWhatsApp: 'إرسال تأكيد واتساب',
    noPhone: 'لا يوجد رقم هاتف للعميلة',
    whatsappSent: 'تم إرسال رسالة واتساب بنجاح',
    simulatedSent: 'تمت المحاكاة — الإرسال الفعلي يتطلب إعداد توكن واتساب',
    clientCreated: 'تم إنشاء العميلة بنجاح',
    save: 'حفظ',
    cancel: 'إلغاء',
    done: 'تم',
    error: 'حدث خطأ',
    loading: 'جاري التحميل...',
    requiredClient: 'يرجى اختيار العميلة',
    requiredEmployee: 'يرجى اختيار الموظفة',
    requiredItems: 'يرجى إضافة عنصر واحد على الأقل',
  },
  en: {
    title: 'Quick POS',
    client: 'Client',
    newClient: 'New client',
    name: 'Name',
    phone: 'Phone',
    employee: 'Employee',
    selectEmployee: 'Select employee',
    paymentMethod: 'Payment method',
    cash: 'Cash',
    card: 'Card',
    wallet: 'Wallet',
    electronicPay: 'Electronic',
    electronicPaySimulated: 'Electronic payment simulated',
    discount: 'Discount',
    tax: 'Tax',
    taxApplicable: 'Taxable',
    notTaxable: 'Tax exempt',
    employeeForAll: 'Service provider (applies to all)',
    itemEmployee: 'Service provider',
    loyaltyBalance: 'Loyalty points balance',
    worthValue: 'worth',
    usePoints: 'Use',
    useAllPoints: 'Use all',
    willEarn: 'Will earn',
    pointsUnit: 'pts',
    redeemValueHint: 'discount',
    loyaltyPoints: 'Loyalty points',
    searchClientHint: 'Search by name or phone number',
    offerCode: 'Offer / Coupon code',
    redeemPoints: 'Points to redeem',
    tip: 'Tip',
    giftCardCode: 'Gift card code',
    giftCardUsed: 'Gift card',
    tipLine: 'Tip',
    printReceipt: 'Print Receipt',
    pointsEarned: 'Loyalty points earned',
    services: 'Services',
    products: 'Products',
    tabCafeteria: 'Cafeteria',
    cafeteriaEmpty: 'No cafeteria products yet — add a product with category "cafeteria" from Inventory',
    cafeteriaHint: 'Tap a product to add it to the cart and complete the invoice as usual',
    cafeteriaQty: 'In stock',
    search: 'Search...',
    allCategories: 'All',
    category: 'Category',
    price: 'Price',
    outOfStock: 'Out of stock',
    cart: 'Cart',
    cartEmpty: 'Cart is empty',
    noResults: 'No results',
    remove: 'Remove',
    subtotal: 'Subtotal',
    total: 'Total',
    complete: 'Complete',
    completeHint: 'Select a client and employee and add at least one item',
    invoiceCreated: 'Invoice created successfully',
    invoiceNo: 'Invoice No.',
    totalPaid: 'Total',
    sendWhatsApp: 'Send WhatsApp confirmation',
    noPhone: 'No phone on file',
    whatsappSent: 'WhatsApp message sent successfully',
    simulatedSent: 'Simulated — real sending requires configuring the WhatsApp token',
    clientCreated: 'Client created successfully',
    save: 'Save',
    cancel: 'Cancel',
    done: 'Done',
    error: 'Something went wrong',
    loading: 'Loading...',
    requiredClient: 'Please select a client',
    requiredEmployee: 'Please select an employee',
    requiredItems: 'Please add at least one item',
  },
} as const;

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'WALLET', 'ELECTRONIC'];

interface CartItem {
  key: string;
  kind: 'service' | 'product';
  id: number;
  name: string;
  unitPrice: number;
  quantity: number;
  employeeId: number | '';
}

const money = (value: number): string =>
  Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Request failed';
};

const buildConfirmationMessage = (
  clientName: string,
  invoiceNo: string,
  total: number,
  lang: 'ar' | 'en',
  salonName: string,
): string => {
  if (lang === 'en') {
    return `Dear ${clientName},\n\nThank you for visiting us! Your invoice ${invoiceNo} total is ${total}.\n\n${salonName}`;
  }
  return `عزيزتي ${clientName}،\n\nشكراً لزيارتك! فاتورتك ${invoiceNo} بإجمالي ${total}.\n\n${salonName}`;
};

export default function POSPage() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [discount, setDiscount] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [redeemPoints, setRedeemPoints] = useState('');
  const [tip, setTip] = useState('');
  const [giftCardCode, setGiftCardCode] = useState('');

  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [successInvoice, setSuccessInvoice] = useState<Invoice | null>(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(
    null,
  );

  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  const [salonName, setSalonName] = useState(t('general.appName'));
  const [qrMode, setQrMode] = useState<'square' | 'text'>('square');
  const [vatNumber, setVatNumber] = useState(ZATCA_VAT_NUMBER);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [salonPolicy, setSalonPolicy] = useState('');
  const [vatRate, setVatRate] = useState(15);
  const [logoUrl, setLogoUrl] = useState('');
  const [pointsPerCurrency, setPointsPerCurrency] = useState(1);
  const [pointValue, setPointValue] = useState(0.1);

  useEffect(() => {
    let active = true;
    getSettings()
      .then((res) => {
        const map: Record<string, string> = {};
        for (const it of res.items) map[it.key] = it.value;
        const name = (lang === 'ar' ? map['SALON_NAME_AR'] : map['SALON_NAME_EN'])?.trim();
        if (active && name) setSalonName(name);
        const vat = map['ZATCA_VAT_NUMBER']?.trim();
        if (active && vat) setVatNumber(vat);
        const mode = map['QR_DISPLAY_MODE'] as 'square' | 'text' | undefined;
        if (active && (mode === 'square' || mode === 'text')) setQrMode(mode);
        if (active) {
          setWelcomeMessage(map['WELCOME_MESSAGE']?.trim() ?? '');
          setSalonPolicy(map['SALON_POLICY']?.trim() ?? '');
          const rate = Number(map['VAT_RATE']);
          if (Number.isFinite(rate) && rate >= 0) setVatRate(rate);
          const perCurrency = Number(map['LOYALTY_POINTS_PER_CURRENCY']);
          if (Number.isFinite(perCurrency) && perCurrency > 0) setPointsPerCurrency(perCurrency);
          const pValue = Number(map['LOYALTY_POINT_VALUE']);
          if (Number.isFinite(pValue) && pValue > 0) setPointValue(pValue);
          setLogoUrl(map['SALON_LOGO_URL']?.trim() ?? '');
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nameOf = (item: { nameAr: string; nameEn: string }): string =>
    lang === 'ar' ? item.nameAr : item.nameEn;

  // Service performers (stylists / beauticians) — POS staff are excluded:
  // the person at the register is not necessarily the one doing the service.
  const performers = useMemo(
    () => employees.filter((emp) => emp.role !== 'RECEPTIONIST'),
    [employees],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const [servs, prods, clis, emps] = await Promise.all([
          listServices({ active: true }),
          listProducts({ branchId: selectedBranchId ?? undefined }),
          listClients({ limit: 100 }),
          listEmployees(),
        ]);
        if (!active) return;
        setServices(servs);
        setProducts(prods.data);
        setClients(clis.items);
        setEmployees(emps.filter((e) => e.isActive));
      } catch (err) {
        if (active) setSnack({ message: getErrorMessage(err), severity: 'error' });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId]);

  const serviceCategories = useMemo(
    () => Array.from(new Set(services.map((s) => s.category))),
    [services],
  );

  const productCategories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .filter((p) => p.category?.toLowerCase() !== 'cafeteria')
            .map((p) => p.category),
        ),
      ),
    [products],
  );

  // Stored values stay English; Arabic is a display label only.
  const categoryDisplay = (cat: string): string =>
    cat === 'cafeteria' && lang === 'ar' ? 'كافيتريا' : cat;

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      const matchesSearch =
        q === '' ||
        s.nameAr.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q);
      const matchesCategory = category === 'all' || s.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [services, search, category]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (p.isActive === false) return false;
      // Products tab shows COSMETICS/PRODUCTS-style categories only —
      // cafeteria items live exclusively in the Cafeteria tab.
      if (p.category === 'cafeteria') return false;
      const matchesSearch =
        q === '' ||
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q);
      const matchesCategory = category === 'all' || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const cafeteriaProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (p.category !== 'cafeteria') return false;
      if (p.isActive === false) return false;
      return (
        q === '' ||
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  const [taxEnabled, setTaxEnabled] = useState(true);
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountNum = Number(discount) || 0;
  const taxableBase = Math.max(subtotal - discountNum, 0);
  const taxNum = taxEnabled ? Math.round(taxableBase * vatRate) / 100 : 0;
  const tipNum = Number(tip) || 0;
  const total = Math.max(subtotal - discountNum + taxNum + tipNum, 0);

  const allItemsHaveEmployee = cart.every((c) => c.employeeId !== '');
  const canComplete = Boolean(selectedClient && cart.length > 0 && allItemsHaveEmployee);

  // ---- Loyalty ----
  const clientPoints = selectedClient?.loyaltyPoints ?? 0;
  const redeemNum = Number(redeemPoints) || 0;
  const redeemValue = Math.round(Math.min(redeemNum * pointValue, total) * 100) / 100;
  const willEarn = Math.floor(Math.max(total - redeemValue, 0) * pointsPerCurrency);

  const addToCart = (item: { kind: CartItem['kind']; id: number; name: string; unitPrice: number }) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.kind === item.kind && c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.kind === item.kind && c.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        );
      }
      return [
        ...prev,
        { key: `${item.kind}-${item.id}`, ...item, quantity: 1, employeeId },
      ];
    });
  };

  const addService = (service: Service) =>
    addToCart({
      kind: 'service',
      id: service.id,
      name: nameOf(service),
      unitPrice: Number(service.price) || 0,
    });

  const addProduct = (product: Product) => {
    const inCart = cart.find((c) => c.kind === 'product' && c.id === product.id)?.quantity ?? 0;
    if (product.quantity <= 0 || inCart + 1 > product.quantity) {
      setSnack({ message: l.outOfStock, severity: 'error' });
      return;
    }
    addToCart({
      kind: 'product',
      id: product.id,
      name: nameOf(product),
      unitPrice: Number(product.salePrice) || 0,
    });
  };

  const increment = (key: string) => {
    const item = cart.find((c) => c.key === key);
    if (item?.kind === 'product') {
      const product = products.find((p) => p.id === item.id);
      if (product && item.quantity + 1 > product.quantity) {
        setSnack({ message: l.outOfStock, severity: 'error' });
        return;
      }
    }
    setCart((prev) =>
      prev.map((c) => (c.key === key ? { ...c, quantity: c.quantity + 1 } : c)),
    );
  };

  const decrement = (key: string) =>
    setCart((prev) =>
      prev
        .map((c) => (c.key === key ? { ...c, quantity: c.quantity - 1 } : c))
        .filter((c) => c.quantity > 0),
    );

  const removeFromCart = (key: string) =>
    setCart((prev) => prev.filter((c) => c.key !== key));

  const handleComplete = async () => {
    const effectiveEmployeeId =
      employeeId !== '' ? employeeId : (cart.find((c) => c.employeeId !== '')?.employeeId ?? '');
    if (!selectedClient || effectiveEmployeeId === '' || cart.length === 0) {
      setSnack({
        message: !selectedClient
          ? l.requiredClient
          : effectiveEmployeeId === ''
            ? l.requiredEmployee
            : l.requiredItems,
        severity: 'error',
      });
      return;
    }
    setSubmitting(true);
    try {
      const invoice = await createInvoiceManual({
        clientId: selectedClient.id,
        employeeId: effectiveEmployeeId,
        discount: discountNum,
        tax: taxNum,
        tip: tipNum > 0 ? tipNum : undefined,
        paymentMethod,
        offerCode: offerCode.trim() || undefined,
        redeemPoints: Number(redeemPoints) > 0 ? Number(redeemPoints) : undefined,
        giftCardCode: giftCardCode.trim() || undefined,
        items: cart.map((item) => ({
          serviceId: item.kind === 'service' ? item.id : undefined,
          productId: item.kind === 'product' ? item.id : undefined,
          employeeId: item.employeeId !== '' ? Number(item.employeeId) : undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      setSuccessInvoice(invoice);
      if (paymentMethod === 'ELECTRONIC') {
        try {
          await createPayment({
            invoiceId: invoice.id,
            amount: Number(invoice.total) || total,
            method: 'SIMULATED',
          });
        } catch {
          // ignore electronic payment simulation failure
        }
      }
      setCart([]);
      setDiscount('');
      setOfferCode('');
      setRedeemPoints('');
      setTip('');
      setGiftCardCode('');
      setCategory('all');
      setSearch('');
      try {
        const refreshed = await listProducts({ branchId: selectedBranchId ?? undefined });
        setProducts(refreshed.data);
      } catch {
        // ignore refresh failure
      }
    } catch (err) {
      setSnack({ message: getErrorMessage(err), severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendConfirmation = async () => {
    if (!successInvoice || !selectedClient) {
      return;
    }
    const phone = selectedClient.whatsapp || selectedClient.phone;
    if (!phone) {
      setSnack({ message: l.noPhone, severity: 'error' });
      return;
    }
    setSendingWhatsApp(true);
    try {
      const message = buildConfirmationMessage(
        selectedClient.name,
        successInvoice.invoiceNo,
        Number(successInvoice.total) || 0,
        lang,
        salonName,
      );
      const result = await sendWhatsApp({
        phone,
        message,
        referenceId: `INV-${successInvoice.id}`,
        type: 'invoice-confirmation',
      });
      setSnack({
        message: result.simulated ? l.simulatedSent : l.whatsappSent,
        severity: 'success',
      });
    } catch (err) {
      setSnack({ message: getErrorMessage(err), severity: 'error' });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!successInvoice) return;
    const win = window.open('', '_blank', 'width=340,height=620');
    if (!win) return;
    const rows = (successInvoice.items ?? [])
      .map(
        (item) =>
          `<tr><td colspan="2" style="padding:2px 0">${item.description}</td></tr><tr><td style="padding:0 0 3px;color:#555">${item.quantity} × ${money(Number(item.unitPrice))}</td><td style="text-align:right;padding:0 0 3px">${money(Number(item.lineTotal))}</td></tr>`,
      )
      .join('');
    const tipLine =
      Number(successInvoice.tip) > 0
        ? `<div class="row"><span>${l.tipLine}</span><span>+${money(Number(successInvoice.tip))}</span></div>`
        : '';
    const giftLine =
      Number(successInvoice.giftCardAmount) > 0
        ? `<div class="row"><span>${l.giftCardUsed}</span><span style="color:#2e7d32">-${money(Number(successInvoice.giftCardAmount))}</span></div>`
        : '';
    const barcode = barcodeSvgDataUrl(successInvoice.invoiceNo);
    const qrPayload = buildInvoiceQrPayload({
      sellerName: salonName || t('general.appName'),
      vatNumber: vatNumber || ZATCA_VAT_NUMBER,
      timestamp: new Date(successInvoice.date).toISOString(),
      invoiceTotal: Number(successInvoice.total),
      vatAmount: Number(successInvoice.tax),
    });
    const qrImgUrl = qrMode === 'square' ? await generateQrImageDataUrl(qrPayload).catch(() => '') : '';
    const vatLabel = vatNumber || ZATCA_VAT_NUMBER;
    const qrHtml =
      qrMode === 'square'
        ? `<img src="${qrImgUrl}" alt="QR" style="width:100px;height:100px;display:block;margin:4px auto" />`
        : `<div class="qr-block">${qrPayload}</div>`;
    const taxable = Number(successInvoice.subtotal) - Number(successInvoice.discount);
    const vatRate = taxable > 0 ? (Number(successInvoice.tax) / taxable) * 100 : 15;
    win.document.write(`<!doctype html>
<html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head><meta charset="utf-8" /><title>${successInvoice.invoiceNo}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { width: 80mm; margin: 0; padding: 3mm 4mm; font-family: 'Courier New', 'Tahoma', monospace; font-size: 11px; color: #000; background: #fff; }
  .center { text-align: center; }
  .brand { font-size: 16px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
  .badge { display: inline-block; border: 1px solid #000; padding: 1px 8px; font-size: 9px; font-weight: bold; margin-top: 2px; }
  .muted { color: #333; font-size: 10px; }
  .dash { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  .solid { border: none; border-top: 1px solid #000; margin: 5px 0; }
  .row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 11px; }
  .barcode { max-width: 90%; height: auto; }
  table { width: 100%; border-collapse: collapse; }
  tbody tr { vertical-align: top; }
  .totals { margin-top: 4px; }
  .grand { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 3px double #000; border-bottom: 3px double #000; padding: 4px 0; margin: 4px 0; }
  .qr-block { margin-top: 4px; padding: 4px; border: 1px dashed #000; font-family: 'Courier New', monospace; font-size: 7px; word-break: break-all; text-align: left; }
  .welcome { text-align: center; font-size: 11px; font-weight: bold; padding: 4px 0; }
  .policy { text-align: center; font-size: 8px; color: #333; white-space: pre-line; padding: 2px 4mm; }
  .footer { text-align: center; font-size: 10px; margin-top: 6px; letter-spacing: 2px; }
  .no-print-btn { display: block; margin: 12px auto; padding: 6px 24px; font-family: inherit; font-size: 13px; }
  @media print {
    body { width: 80mm; padding: 2mm 3mm; }
    .no-print-btn { display: none; }
  }
</style></head>
<body>
  <div class="center">
    ${logoUrl ? `<img src="${logoUrl}" alt="logo" style="max-width:38mm;max-height:20mm;object-fit:contain;display:block;margin:0 auto 2mm" />` : ''}
    <div class="brand">${salonName}</div>
    <span class="badge">${lang === 'ar' ? 'فاتورة ضريبية مبسطة' : 'SIMPLIFIED TAX INVOICE'}</span>
    <div class="muted" style="margin-top:3px">${lang === 'ar' ? 'الرقم الضريبي' : 'VAT No.'}: ${vatLabel}</div>
  </div>
  <hr class="solid" />
  <div class="row"><span>${lang === 'ar' ? 'رقم الفاتورة' : 'Invoice No.'}:</span><span>${successInvoice.invoiceNo}</span></div>
  <div class="row"><span>${lang === 'ar' ? 'التاريخ' : 'Date'}:</span><span>${new Date(successInvoice.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span></div>
  <div class="row"><span>${l.client}:</span><span>${selectedClient?.name ?? successInvoice.client?.name ?? '—'}</span></div>
  <div class="row"><span>${l.employee}:</span><span>${successInvoice.employee ? nameOf(successInvoice.employee) : employees.find((e) => e.id === Number(employeeId)) ? nameOf(employees.find((e) => e.id === Number(employeeId))!) : '—'}</span></div>
  <div class="center" style="margin:4px 0"><img class="barcode" src="${barcode}" alt="${successInvoice.invoiceNo}" /></div>
  <hr class="dash" />
  <table><tbody>${rows}</tbody></table>
  <hr class="dash" />
  <div class="totals">
    <div class="row"><span>${lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}:</span><span>${money(Number(successInvoice.subtotal))}</span></div>
    <div class="row"><span>${l.discount}:</span><span>${money(Number(successInvoice.discount))}</span></div>
    <div class="row"><span>${lang === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} (${vatRate.toFixed(2)}%):</span><span>${money(Number(successInvoice.tax))}</span></div>
    ${tipLine}
    ${giftLine}
    <div class="grand"><span>${l.total}:</span><span>${money(Number(successInvoice.total))}</span></div>
  </div>
  <div class="center">${qrHtml}</div>
  ${welcomeMessage ? `<hr class="dash" /><div class="welcome">${welcomeMessage}</div>` : ''}
  ${salonPolicy ? `<div class="policy">${salonPolicy}</div>` : ''}
  <div class="footer">*** ${lang === 'ar' ? 'شكراً لثقتكم' : 'THANK YOU'} ***</div>
  <button class="no-print-btn" onclick="window.print()">${l.printReceipt}</button>
</body></html>`);
    win.document.close();
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      return;
    }
    setCreatingClient(true);
    try {
      const created = await createClient({
        name: newClientName.trim(),
        phone: newClientPhone.trim() || undefined,
      });
      setClients((prev) => [created, ...prev]);
      setSelectedClient(created);
      setNewClientOpen(false);
      setNewClientName('');
      setNewClientPhone('');
      setSnack({ message: l.clientCreated, severity: 'success' });
    } catch (err) {
      setSnack({ message: getErrorMessage(err), severity: 'error' });
    } finally {
      setCreatingClient(false);
    }
  };

  const clientPhone = selectedClient ? selectedClient.whatsapp || selectedClient.phone : null;

  const paymentLabels: Record<PaymentMethod, string> = {
    CASH: l.cash,
    CARD: l.card,
    WALLET: l.wallet,
    ELECTRONIC: l.electronicPay,
  };

  return (
    <Box>
      <PageHeader title={l.title} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, mb: 2 }}>
            <Stack spacing={4}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => setNewClientOpen(true)}
              >
                {l.newClient}
              </Button>
              <Autocomplete<Client>
                size="small"
                sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 260 } }}
                options={clients}
                getOptionLabel={(c) => c.name}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                value={selectedClient}
                onChange={(_e, value) => setSelectedClient(value)}
                filterOptions={(options, state) => {
                  const q = state.inputValue.trim().toLowerCase();
                  if (q === '') return options;
                  return options.filter(
                    (c) =>
                      c.name.toLowerCase().includes(q) ||
                      (c.phone ?? '').toLowerCase().includes(q) ||
                      (c.whatsapp ?? '').toLowerCase().includes(q),
                  );
                }}
                renderOption={(props, c) => {
                  const { key, ...rest } = props as { key?: string };
                  return (
                    <Box component="li" key={key ?? c.id} {...rest}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {c.name}
                          {(c.phone || c.whatsapp) && (
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              {c.phone || c.whatsapp}
                            </Typography>
                          )}
                        </Typography>
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={`${l.loyaltyPoints}: ${c.loyaltyPoints ?? 0}`}
                        />
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField {...params} label={l.client} placeholder={l.searchClientHint} />
                )}
              />
              {selectedClient && (
                <Chip
                  color="primary"
                  label={`${selectedClient.name} — ${l.loyaltyPoints}: ${selectedClient.loyaltyPoints ?? 0}`}
                />
              )}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} rowGap={1.5} flexWrap="wrap">
              <FormControl size="small" sx={{ width: { xs: '100%', lg: 155 } }}>
                <InputLabel id="pos-employee-label">{l.employeeForAll}</InputLabel>
                <Select<number | ''>
                  labelId="pos-employee-label"
                  label={l.employeeForAll}
                  value={employeeId}
                  onChange={(e: SelectChangeEvent<number | ''>) => {
                    const val = e.target.value as number | '';
                    setEmployeeId(val);
                    // Applying to the whole cart — same person can perform all services.
                    if (val !== '') {
                      setCart((prev) => prev.map((c) => ({ ...c, employeeId: val })));
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    {l.selectEmployee}
                  </MenuItem>
                  {performers.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {nameOf(emp)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ width: { xs: '100%', lg: 130 } }}>
                <InputLabel id="pos-payment-label">{l.paymentMethod}</InputLabel>
                <Select<PaymentMethod>
                  labelId="pos-payment-label"
                  label={l.paymentMethod}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method} value={method}>
                      {paymentLabels[method]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label={l.discount}
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                inputProps={{ min: 0, step: '0.01' }}
                sx={{ width: { xs: '100%', lg: 105 } }}
              />
              <FormControlLabel
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  px: 1,
                  py: 0.25,
                }}
                control={
                  <Switch
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="caption">
                    {l.taxApplicable} {taxEnabled ? `(${vatRate}%)` : ''}
                  </Typography>
                }
              />
              <TextField
                size="small"
                label={l.offerCode}
                value={offerCode}
                onChange={(e) => setOfferCode(e.target.value)}
                sx={{ width: { xs: '100%', lg: 145 } }}
              />
              <TextField
                size="small"
                label={`${l.redeemPoints}${redeemNum > 0 ? ` (= ${redeemValue.toFixed(2)})` : ''}`}
                type="number"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                inputProps={{ min: 0, step: 1, max: clientPoints }}
                error={redeemNum > clientPoints}
                sx={{ width: { xs: '100%', lg: 150 } }}
              />
              <TextField
                size="small"
                label={l.tip}
                type="number"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                inputProps={{ min: 0, step: '0.01' }}
                sx={{ width: { xs: '100%', lg: 100 } }}
              />
              <TextField
                size="small"
                label={l.giftCardCode}
                value={giftCardCode}
                onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                sx={{ width: { xs: '100%', lg: 150 } }}
              />
            </Stack>
            </Stack>
          </Paper>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedClient && (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 2,
                }}
              >
                <StarIcon sx={{ fontSize: 34, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
                    {clientPoints} {l.pointsUnit}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    {l.loyaltyBalance} — {l.worthValue} {(clientPoints * pointValue).toFixed(2)}
                  </Typography>
                </Box>
                {clientPoints > 0 && (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ ml: 'auto' }}>
                    {[25, 50, 100]
                      .filter((n) => n <= clientPoints)
                      .map((n) => (
                        <Chip
                          key={n}
                          label={`${l.usePoints} ${n}`}
                          onClick={() => setRedeemPoints(String(n))}
                          size="small"
                          sx={{
                            bgcolor: redeemNum === n ? '#fff' : 'rgba(255,255,255,0.22)',
                            color: redeemNum === n ? 'primary.main' : 'inherit',
                            fontWeight: 700,
                          }}
                        />
                      ))}
                    <Chip
                      label={l.useAllPoints}
                      onClick={() => setRedeemPoints(String(clientPoints))}
                      size="small"
                      sx={{
                        bgcolor: redeemNum === clientPoints ? '#fff' : 'rgba(255,255,255,0.22)',
                        color: redeemNum === clientPoints ? 'primary.main' : 'inherit',
                        fontWeight: 700,
                      }}
                    />
                  </Stack>
                )}
                <Typography variant="caption" sx={{ width: '100%', opacity: 0.85 }}>
                  {l.willEarn}: ≈ {willEarn} {l.pointsUnit}
                </Typography>
              </Paper>
            )}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Tabs value={tab} onChange={(_e, newValue) => setTab(newValue as number)}>
                <Tab label={l.services} />
                <Tab label={l.products} />
                <Tab icon={<CoffeeIcon />} iconPosition="start" label={l.tabCafeteria} />
              </Tabs>

              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  placeholder={l.search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ width: { xs: '100%', sm: 240 } }}
                />
                <Chip
                  label={l.allCategories}
                  color={category === 'all' ? 'primary' : 'default'}
                  onClick={() => setCategory('all')}
                />
                {(tab === 0 ? serviceCategories : tab === 1 ? productCategories : []).map((cat) => (
                  <Chip
                    key={cat}
                    label={categoryDisplay(cat)}
                    color={category === cat ? 'primary' : 'default'}
                    onClick={() => setCategory(cat)}
                  />
                ))}
              </Stack>

              {tab === 0 ? (
                <Box
                  sx={{
                    mt: 2,
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(2, 1fr)',
                      sm: 'repeat(auto-fill, minmax(160px, 1fr))',
                    },
                    gap: { xs: 1, sm: 1.5 },
                  }}
                >
                  {filteredServices.map((service) => (
                    <Button
                      key={service.id}
                      variant="outlined"
                      onClick={() => addService(service)}
                      sx={{
                        height: '100%',
                        minHeight: { xs: 96, sm: 84 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        textTransform: 'none',
                        p: 1.5,
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {nameOf(service)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {l.price}: {money(Number(service.price) || 0)}
                      </Typography>
                    </Button>
                  ))}
                  {filteredServices.length === 0 && (
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                      {l.noResults}
                    </Typography>
                  )}
                </Box>
              ) : tab === 1 ? (
                <Box
                  sx={{
                    mt: 2,
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(2, 1fr)',
                      sm: 'repeat(auto-fill, minmax(160px, 1fr))',
                    },
                    gap: { xs: 1, sm: 1.5 },
                  }}
                >
                  {filteredProducts.map((product) => {
                    const soldOut = product.quantity <= 0;
                    return (
                      <Button
                        key={product.id}
                        variant="outlined"
                        disabled={soldOut}
                        onClick={() => addProduct(product)}
                        sx={{
                          height: '100%',
                          minHeight: { xs: 96, sm: 84 },
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          textTransform: 'none',
                          p: 1.5,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {nameOf(product)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {l.price}: {money(Number(product.salePrice) || 0)}
                        </Typography>
                        {soldOut && (
                          <Typography variant="caption" color="error">
                            {l.outOfStock}
                          </Typography>
                        )}
                      </Button>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                      {l.noResults}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 2,
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(2, 1fr)',
                      sm: 'repeat(auto-fill, minmax(160px, 1fr))',
                    },
                    gap: { xs: 1, sm: 1.5 },
                  }}
                >
                  {cafeteriaProducts.map((product) => {
                    const soldOut = product.quantity <= 0;
                    return (
                      <Button
                        key={product.id}
                        variant="outlined"
                        disabled={soldOut}
                        onClick={() => addProduct(product)}
                        sx={{
                          height: '100%',
                          minHeight: { xs: 96, sm: 84 },
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          textTransform: 'none',
                          p: 1.5,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {nameOf(product)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {l.price}: {money(Number(product.salePrice) || 0)}
                        </Typography>
                        {soldOut ? (
                          <Typography variant="caption" color="error">
                            {l.outOfStock}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="primary">
                            {l.cafeteriaQty}: {product.quantity}
                          </Typography>
                        )}
                      </Button>
                    );
                  })}
                  {cafeteriaProducts.length === 0 && (
                    <Box>
                      <Typography color="text.secondary" sx={{ mt: 2 }}>
                        {l.cafeteriaEmpty}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {l.cafeteriaHint}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <Paper
              variant="outlined"
              sx={{ width: '100%', maxWidth: 720, mx: 'auto', p: 2 }}
            >
              <Typography variant="h6" gutterBottom>
                {l.cart}
              </Typography>
              {cart.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {l.cartEmpty}
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {cart.map((item) => (
                    <Box
                      key={item.key}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                        borderBottom: '1px dashed',
                        borderColor: 'divider',
                        pb: 1,
                      }}
                    >
                      <Box sx={{ flexGrow: 1, minWidth: 120 }}>
                        <Typography variant="body2" noWrap>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {money(item.unitPrice)} × {item.quantity}
                        </Typography>
                      </Box>
                      <FormControl size="small" sx={{ minWidth: 150, flexGrow: 1 }}>
                        <InputLabel id={`item-emp-${item.key}`}>{l.itemEmployee}</InputLabel>
                        <Select<number | ''>
                          labelId={`item-emp-${item.key}`}
                          label={l.itemEmployee}
                          value={item.employeeId}
                          onChange={(e: SelectChangeEvent<number | ''>) =>
                            setCart((prev) =>
                              prev.map((c) =>
                                c.key === item.key
                                  ? { ...c, employeeId: e.target.value as number | '' }
                                  : c,
                              ),
                            )
                          }
                        >
                          <MenuItem value="" disabled>
                            {l.selectEmployee}
                          </MenuItem>
                          {performers.map((emp) => (
                            <MenuItem key={emp.id} value={emp.id}>
                              {nameOf(emp)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Tooltip title={l.remove}>
                        <IconButton size="small" onClick={() => decrement(item.key)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton size="small" onClick={() => increment(item.key)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeFromCart(item.key)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{l.subtotal}</Typography>
                  <Typography variant="body2">{money(subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{l.discount}</Typography>
                  <Typography variant="body2" color="error.main">
                    -{money(discountNum)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {l.tax}
                    {taxEnabled ? ` (${vatRate}%)` : ' —'}
                  </Typography>
                  <Typography variant="body2">
                    {taxEnabled ? `+${money(taxNum)}` : l.notTaxable}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{l.tipLine}</Typography>
                  <Typography variant="body2">+{money(tipNum)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {l.total}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {money(total)}
                  </Typography>
                </Box>
              </Stack>
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                disabled={!canComplete || submitting}
                onClick={() => void handleComplete()}
                startIcon={
                  submitting ? <CircularProgress size={18} color="inherit" /> : undefined
                }
              >
                {l.complete}
              </Button>
              {!canComplete && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {l.completeHint}
                </Typography>
              )}
            </Paper>
          </Box>
        </>
      )}

      <Dialog
        open={!!successInvoice}
        onClose={() => setSuccessInvoice(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{l.invoiceCreated}</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {successInvoice && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{l.invoiceNo}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {successInvoice.invoiceNo}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{l.employee}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {successInvoice.employee
                      ? nameOf(successInvoice.employee)
                      : performers.find((e) => e.id === Number(employeeId))
                        ? nameOf(performers.find((e) => e.id === Number(employeeId))!)
                        : '—'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{l.totalPaid}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {money(Number(successInvoice.total) || 0)}
                  </Typography>
                </Box>
                {Number(successInvoice.tip) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{l.tipLine}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      +{money(Number(successInvoice.tip) || 0)}
                    </Typography>
                  </Box>
                )}
                {Number(successInvoice.giftCardAmount) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{l.giftCardUsed}</Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      -{money(Number(successInvoice.giftCardAmount) || 0)}
                    </Typography>
                  </Box>
                )}
                {Number(successInvoice.pointsEarned) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{l.pointsEarned}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {Number(successInvoice.pointsEarned)}
                    </Typography>
                  </Box>
                )}
                {successInvoice.paymentMethod === 'ELECTRONIC' && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{l.electronicPay}</Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {l.electronicPaySimulated}
                    </Typography>
                  </Box>
                )}
              </>
            )}
            <Button
              variant="contained"
              color="success"
              startIcon={<WhatsAppIcon />}
              disabled={!clientPhone || sendingWhatsApp}
              onClick={() => void handleSendConfirmation()}
            >
              {sendingWhatsApp ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                l.sendWhatsApp
              )}
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrintReceipt}
            >
              {l.printReceipt}
            </Button>
            {!clientPhone && (
              <Typography variant="caption" color="text.secondary">
                {l.noPhone}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessInvoice(null)}>{l.done}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={newClientOpen} onClose={() => setNewClientOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{l.newClient}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={l.name}
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label={l.phone}
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewClientOpen(false)}>{l.cancel}</Button>
          <Button
            variant="contained"
            disabled={!newClientName.trim() || creatingClient}
            onClick={() => void handleCreateClient()}
          >
            {creatingClient ? <CircularProgress size={18} color="inherit" /> : l.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack(null)}
          severity={snack?.severity ?? 'success'}
          variant="filled"
        >
          {snack?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}