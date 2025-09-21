// import { useEffect, useMemo, useState } from "react";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useMutation, useQueryClient } from "@tanstack/react-query";

// const schema = z.object({
//   title: z.string().min(1, "Title is required"),
//   description: z.string().optional().or(z.literal("")),
// });
// type Form = z.infer<typeof schema>;

// export default function AssignLessonModal({
//   open,
//   onClose,
//   students,
// }: {
//   open: boolean;
//   onClose: () => void;
//   students: any[];
// }) {
//   const { register, handleSubmit, formState, reset, setFocus } = useForm<Form>({
//     resolver: zodResolver(schema),
//   });
//   const [q, setQ] = useState("");
//   const [selected, setSelected] = useState<Record<string, boolean>>({});

//   const filtered = useMemo(() => {
//     const s = q.toLowerCase();
//     return students.filter((x) =>
//       [x.username, x.email ?? "", x.phoneNumber].some((v) =>
//         v.toLowerCase().includes(s),
//       ),
//     );
//   }, [q, students]);

//   useEffect(() => {
//     if (open) {
//       reset({ title: "", description: "" });
//       setSelected({});
//       setTimeout(() => setFocus("title"), 0);
//     }
//   }, [open, reset, setFocus]);

//   const qc = useQueryClient();
//   const mut = useMutation({
//     mutationFn: (data: Form) =>
//       assignLesson({
//         title: data.title,
//         description: data.description,
//         phones: Object.keys(selected).filter((k) => selected[k]),
//       }),
//     onSuccess: (res) => {
//       if (res.ok) {
//         qc.invalidateQueries({ queryKey: ["students"] });
//         alert("Lesson assigned");
//         onClose();
//       } else {
//         alert(res.error.message);
//       }
//     },
//     onError: () => alert("Assign failed"),
//   });

//   const submit = (data: Form) => {
//     if (mut.isPending) return;
//     mut.mutate(data);
//   };

//   return (
//     <dialog
//       className={`modal ${open ? "modal-open" : ""}`}
//       aria-modal="true"
//       role="dialog"
//       onClose={onClose}
//     >
//       <div className="modal-box">
//         <h3 className="mb-2 text-lg font-semibold">Assign Lesson</h3>

//         <form className="space-y-3" onSubmit={handleSubmit(submit)}>
//           <label className="form-control">
//             <span className="label-text">Title</span>
//             <input className="input input-bordered" {...register("title")} />
//             {formState.errors.title && (
//               <span className="text-error text-sm">
//                 {formState.errors.title.message}
//               </span>
//             )}
//           </label>

//           <label className="form-control">
//             <span className="label-text">Description</span>
//             <textarea
//               className="textarea textarea-bordered"
//               rows={3}
//               {...register("description")}
//             />
//           </label>

//           <div className="form-control">
//             <span className="label-text mb-1">Select Students</span>
//             <input
//               className="input input-bordered mb-2"
//               placeholder="Filter students…"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//               aria-label="Filter students"
//             />
//             <div className="border-base-200 rounded-box max-h-48 overflow-auto border">
//               {filtered.map((s) => (
//                 <label
//                   key={s.phone}
//                   className="flex cursor-pointer items-center gap-2 px-3 py-2"
//                 >
//                   <input
//                     type="checkbox"
//                     className="checkbox checkbox-sm"
//                     checked={!!selected[s.phone]}
//                     onChange={(e) =>
//                       setSelected((m) => ({
//                         ...m,
//                         [s.phone]: e.target.checked,
//                       }))
//                     }
//                     aria-label={`Select ${s.name}`}
//                   />
//                   <span className="flex-1">{s.name}</span>
//                   <span className="opacity-60">{s.phone}</span>
//                 </label>
//               ))}
//               {filtered.length === 0 && (
//                 <div className="p-3 opacity-60">No results</div>
//               )}
//             </div>
//           </div>

//           <div className="modal-action">
//             <button type="button" className="btn" onClick={onClose}>
//               Cancel
//             </button>
//             <button
//               className={`btn btn-primary ${mut.isPending ? "btn-disabled" : ""}`}
//               disabled={mut.isPending}
//               data-testid="assign-submit"
//             >
//               {mut.isPending ? "Assigning…" : "Assign"}
//             </button>
//           </div>
//         </form>
//       </div>
//       <form method="dialog" className="modal-backdrop" onSubmit={onClose}>
//         <button aria-label="Close">close</button>
//       </form>
//     </dialog>
//   );
// }
