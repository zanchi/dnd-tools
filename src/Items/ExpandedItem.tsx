import { FunctionalComponent as FC } from 'preact'

import { TraitLine } from 'src/Creatures/ExpandedItem'
import styles from 'src/Creatures/ExpandedItem.module.scss'
import { Item } from './types'

type Props = Item & {
  onCollapse: () => unknown
}

const meta = (item: Item) =>
  `${item.type}, ${item.rarity}${
    item.attunement ? ', (requires attunement)' : ''
  }`

const ExpandedItem: FC<Props> = ({ onCollapse, ...item }) => {
  return (
    <li class={styles.listItem}>
      <div class={styles.titleGroup} onClick={onCollapse}>
        <h2 class={styles.name}>{item.name}</h2>
        <p class={styles.sizeType}>{meta(item)}</p>
      </div>
      <p class={styles.description}>{item.description.toString()}</p>
    </li>
  )
}

export default ExpandedItem
