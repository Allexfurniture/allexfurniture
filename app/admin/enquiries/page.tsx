import Link from "next/link";
import { requireAdmin, formatAdminDate } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
import { updateContactStatus } from "@/app/admin/dashboard/actions";

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; error?: string; saved?: string }> }) {
  const p = await searchParams;
  const { supabase, user } = await requireAdmin();
  const { data, error } = await supabase.from("contacts").select("id,name,email,phone,subject,message,status,created_at").order("created_at", { ascending: false }).limit(500);
  const q = (p.q ?? "").trim().toLowerCase();
  const status = p.status ?? "all";
  const rows = (data ?? []).filter(item => (!q || [item.name, item.email, item.phone ?? "", item.subject, item.message].some(value => value.toLowerCase().includes(q))) && (status === "all" || item.status === status));

  return <WorkflowLayout title="Customer enquiries" description="Review messages submitted through the public contact form and track their status." email={user.email} activePath="/admin/enquiries" error={p.error || (error ? "Could not load enquiries. Check your admin permissions." : undefined)} saved={p.saved}>
    <section className="admin-panel">
      <SectionHeading title="Enquiry inbox" description={rows.length + " matching enquiries"} />
      <div className="admin-filter-row"><form method="get" action="/admin/enquiries" className="admin-filter-form">
        <input type="search" name="q" placeholder="Search name, email, phone or message" defaultValue={p.q ?? ""} />
        <select name="status" defaultValue={status}><option value="all">All statuses</option><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="spam">Spam</option></select>
        <button className="small-button" type="submit">Filter</button><Link className="admin-secondary-button" href="/admin/enquiries">Reset</Link>
      </form></div>
      {rows.length ? <div className="admin-record-list">{rows.map(item => <article className="admin-record" key={item.id}>
        <div className="admin-record-heading"><div><p className="admin-record-kicker">{formatAdminDate(item.created_at)}</p><h3>{item.subject || "Website enquiry"}</h3><p>{item.name} · {item.email}</p><p className="admin-message-preview">{item.message.length > 180 ? item.message.slice(0, 180) + "…" : item.message}</p></div><span className={"status-pill " + item.status}>{item.status.replace("_", " ")}</span></div>
        <div className="admin-row-actions"><Link href={"/admin/enquiries/detail?id=" + item.id} className="small-button">View enquiry</Link>
          <form action={updateContactStatus} className="inline-form"><input type="hidden" name="id" value={item.id} /><input type="hidden" name="return_to" value="/admin/enquiries" /><select name="status" defaultValue={item.status}><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="spam">Spam</option></select><button className="admin-secondary-button" type="submit">Update status</button></form>
        </div>
      </article>)}</div> : <div className="admin-empty-state"><h3>No matching enquiries</h3><p>New website contact submissions will appear here.</p></div>}
    </section>
  </WorkflowLayout>;
}
