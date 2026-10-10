"use client";
import { asset } from "../lib/assets";
const visitors = [
  {
    id: "cat",
    label: "听花猫的故事",
    note: "a little company",
    position: "left",
  },
  {
    id: "whitecat",
    label: "听白猫的故事",
    note: "stay a little longer",
    position: "center",
  },
  {
    id: "dog",
    label: "听小狗的故事",
    note: "always here for you",
    position: "right",
  },
];
export default function AnimalVisitors({
  onAnimal,
}: {
  onAnimal: (animal: string) => void;
}) {
  return (
    <aside className="animal-visitors" aria-label="记忆花园的小访客">
      <div>
        <span>little visitors, little secrets.</span>
        <p>点一下猫猫狗狗，听一句藏在旧时光里的话。</p>
      </div>
      <div className="animal-visitor-buttons">
        {visitors.map((visitor) => (
          <button
            key={visitor.id}
            className="archive-animal"
            onClick={() => onAnimal(visitor.id)}
            aria-label={visitor.label}
          >
            <span
              className="animal-print"
              style={{
                backgroundImage: `url(${asset("/prints/animal-cutouts.png")})`,
                backgroundPosition: `${visitor.position} center`,
              }}
              aria-hidden="true"
            />
            <span className="animal-note">{visitor.note}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
