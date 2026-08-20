export const faNum=(value:number|string|null|undefined)=>value==null?'—':new Intl.NumberFormat('fa-IR').format(Number(value));
export const money=(value:number|null)=>value==null?'قیمت توافقی':`${faNum(value)} تومان`;
export const faDate=(value:string|null)=>value?new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'هنوز بررسی نشده';

