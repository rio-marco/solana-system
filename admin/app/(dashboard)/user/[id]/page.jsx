'use client';

import { UserDetails } from '../../../../components/UserDetails';

export default function UserDetailsPage({ params }) {
    return <UserDetails userId={params?.id} />;
};
