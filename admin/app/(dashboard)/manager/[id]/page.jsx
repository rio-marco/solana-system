'use client';

import { ManagerDetails } from '../../../../components/ManagerDetails';

export default function ManagerDetailsPage({ params }) {
    return <ManagerDetails managerId={params?.id} />;
};
