/** Sales tax applied on "Checkout: Overview". */
export const TAX_RATE = 0.08;

export interface CustomerDetails {
    firstName: string;
    lastName: string;
    postalCode: string;
}

export const customer: CustomerDetails = {
    firstName: 'Test',
    lastName: 'Customer',
    postalCode: '12345',
};

export interface IncompleteCustomer {
    missingField: keyof CustomerDetails;
    details: CustomerDetails;
    /** Error shown on "Checkout: Your Information" after clicking Continue. */
    expectedError: string;
}

export const incompleteCustomers: IncompleteCustomer[] = [
    {
        missingField: 'firstName',
        details: { ...customer, firstName: '' },
        expectedError: 'Error: First Name is required',
    },
    {
        missingField: 'lastName',
        details: { ...customer, lastName: '' },
        expectedError: 'Error: Last Name is required',
    },
    {
        missingField: 'postalCode',
        details: { ...customer, postalCode: '' },
        expectedError: 'Error: Postal Code is required',
    },
];
