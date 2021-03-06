import { AbilityScores as AbScores } from './types'
import styles from './AbilityScores.module.scss'

type Props = {
  editable?: boolean
  onUpdate?: (name: keyof AbScores, newValue: number) => unknown
} & AbScores

const modifier = (abilityScore: number) => Math.floor(abilityScore / 2) - 5

const AbilityScores = ({ editable, onUpdate, ...abilityScores }: Props) => (
  <ol class={styles.scores}>
    {Object.entries(abilityScores).map(([name, score]) => (
      <li class={styles.score}>
        <p class={styles.scoreName}>{name}</p>
        {!editable && <p class={styles.scoreValue}>{score}</p>}
        {editable && (
          <input
            class={styles.scoreInput}
            onInput={(e) =>
              onUpdate?.(name as keyof AbScores, Number(e.currentTarget.value))
            }
            value={score}
          />
        )}
        <p class={styles.modifier}>
          ({modifier(score) >= 0 && '+'}
          {modifier(score)})
        </p>
      </li>
    ))}
  </ol>
)

export default AbilityScores
