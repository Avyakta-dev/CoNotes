export default function PresenceBar({ users }) {
  if (users.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {users.map((u, i) => (
        <span
          key={i}
          className="text-xs font-medium text-white px-3 py-1 rounded-full"
          style={{ backgroundColor: u.color }}
        >
          {u.name}
        </span>
      ))}
    </div>
  );
}