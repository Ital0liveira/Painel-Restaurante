export interface Area {
    id : number;
    name: string;
    maxIdleTime: number; 
    maxIdleTimeEnabled: number
}

//Checkpad
export interface Checkpad{
    id: number;
    hash: string;
    model: string;
    modelIcon: string;
    identifier: string;
    activity: 'empty' | 'active' | 'inactive';
    subtotal: number | null; 
    authorName: string | null; 
    idleTime: number | null; 
    lastOrderCreated: string | null; 
    orderSheetIds: number[]; 
    numberOfCustomers: number | null;  
}

//Comanda
export interface OrderSheet{
    id: number;
    author:{
        id: number;
        name: string;
        type: string;
    };

opened: string;
checkpad:{
        id: number;
        hash: string;
        identifier: string;

} | null;

subtotal: number;
mainIdentifier: string | null;
numberOfCustomers: number;
}
