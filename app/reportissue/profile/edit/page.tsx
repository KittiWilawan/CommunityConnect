import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditProfilePage() {
    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between p-4">
                <Link href="/reportissue/profile">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h2 className="text-xl font-bold">Edit Profile</h2>
            </div>
        </div>
    );
}