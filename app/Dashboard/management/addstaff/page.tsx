import react from 'react';

export default function AddStaffPage() {
    return (
        <div>
            <div className="max-w-2xl mx-auto space-y-6">
                <h1>Add Staff</h1>
                <p>เพิ่มเจ้าหน้าที่ใหม่</p>
                <form>
                    <input type="text" placeholder="Name" />
                    <input type="text" placeholder="Role" />
                    <input type="text" placeholder="Category" />
                    <input type="text" placeholder="Status" />
                    <button type="submit">Add Staff</button>
                </form>

            </div>
        </div>
    );
}