function formatDateLabel(date) {
  const now = new Date();
  const target = new Date(date);

  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffTime = targetMidnight - nowMidnight;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";

  return target.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default formatDateLabel