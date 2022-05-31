import cx from 'classnames'
import useKeyBind from '@zanchi/use-key-bind'
import compose from 'compose-function'
import { spring } from 'css-spring'
import { matchSorter } from 'match-sorter'
import { FunctionComponent as FC } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { mapKeys, mapValues, pick } from 'remeda'

import { useBool, useScreenSize } from 'src/hooks'
import Create from './Create'
import ExpandedItem from './ExpandedItem'
import { SearchHeader } from 'src/components'
import { AbilityScores, Creature, CreatureSize, CreatureType } from './types'
import useCreatures from './useCreatures'
import { getInputVal } from './utils'
import styles from './Creatures.module.scss'
import ListItem from 'src/components/ListItem'

const abilityScores: (creature: Creature) => AbilityScores = compose(
  mapValues((score) => Number.parseInt(score as string)),
  pick(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'])
)
const parseMeta = (
  creature: Creature
): { alignment: string; size: CreatureSize; type: CreatureType } => {
  const [sizeAndType, alignment] = creature.meta.split(',')
  const [size, ...type] = sizeAndType.split(' ')

  return {
    size: size as CreatureSize,
    type: type.join(' ') as CreatureType,
    alignment: alignment.trim(),
  }
}
const alignment = (creature: Creature) => parseMeta(creature).alignment
const size = (creature: Creature) => parseMeta(creature).size
const type = (creature: Creature) => parseMeta(creature).type
const shortTraits = (creature: Creature) =>
  pick(creature, [
    'Saving Throws',
    'Skills',
    'Damage Immunities',
    'Damage Resistances',
    'Damage Vulnerabilities',
    'Condition Immunities',
    'Senses',
    'Languages',
    'Challenge',
  ])
const physicalTraits = (creature: Creature) =>
  pick(creature, ['Armor Class', 'Hit Points', 'Speed'])

const Loading = () => <div class={styles.loading}>Loading</div>

type Props = {
  onAddToInitiative: (c: Creature) => unknown
}

const slideDownKeyframes = (height: number): Keyframe[] =>
  spring(
    { transform: `translateY(-${height}px)` },
    { transform: 'translateY(0px)' },
    { precision: 2, damping: 21, stiffness: 200 }
  )

const Creatures: FC<Props> = ({ onAddToInitiative }) => {
  const [creatures, { add: addCreature }] = useCreatures()
  const [creating, { toggle: toggleCreating }] = useBool(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [width] = useScreenSize()
  const containerRef = useRef<HTMLElement | null>(null)
  const olRef = useRef<HTMLOListElement | null>(null)
  useEffect(() => {
    setSelected(null)
  }, [searchTerm])

  useEffect(() => {
    const lis = olRef.current?.children
    if (lis == null || expanded == null) return

    const lisBelow = Array.prototype.slice.apply(lis, [
      expanded,
    ]) as unknown as HTMLCollection

    const { height } = lis[expanded].getBoundingClientRect()
    const keyframes = Object.values(slideDownKeyframes(height - 95))
    // duration should increase slightly as
    // the amount the items need to move increases.
    const duration = 360 + (0.012 * height) ** 2
    // we don't animate every element after the expanding item,
    // `.animate` is pretty slow and doing a lot is a huge perf hit.
    // 10 should be enough to get to the bottom of the screen,
    // and we don't want to go past the last item.
    const maxIndex = Math.min(lisBelow.length, expanded + 10)

    for (let i = 1; i < maxIndex; i += 1) {
      lisBelow[i].animate(keyframes, {
        easing: 'linear',
        delay: 40,
        duration,
        fill: 'backwards',
      })
    }
  }, [expanded])

  let filteredCreatures: Creature[]
  if (/<>=/.test(searchTerm)) {
    const operatorIndex = searchTerm.search(/<>=/)
    const key = searchTerm.slice(0, operatorIndex).trim()
    const searchValue = searchTerm.slice(operatorIndex + 1).trim()

    filteredCreatures = creatures.filter((creature) => {
      const lowercaseCreature = mapKeys(creature, (k) =>
        String(k).toLowerCase()
      )

      const value = lowercaseCreature[key as keyof Creature] as string
      return value?.includes(searchValue)
    })
  } else {
    filteredCreatures = matchSorter(creatures, searchTerm, {
      keys: ['name'],
    })
  }

  const selectNext = () => {
    if ((selected ?? 0) + 1 > creatures.length) return
    setSelected((s) => (s ?? -1) + 1)
  }

  const selectPrev = () => {
    if ((selected ?? 0) - 1 < 0) {
      setSelected(null)
      return
    }
    setSelected((s) => s! - 1)
  }

  useKeyBind(
    ['Enter'],
    () => {
      if (filteredCreatures.length > 0) {
        // we're hitting enter from the input
        if (selected == null) {
          setExpanded(0)
        } else {
          // const name = filteredCreatures[selected].name
          // setExpanded(name === expanded ? null : name)
        }
      }
    },
    []
  )

  useKeyBind(['ArrowDown'], selectNext, [setSelected])
  useKeyBind(['ArrowUp'], selectPrev, [setSelected])

  const deselect = () => setExpanded(null)
  const scrollTo = (top: number) => {
    const args = {
      behavior: 'smooth',
      top,
    }

    // on mobile, the window is as tall as the content.
    // on desktop, the window is as tall as the screen,
    // and the containing section has overflow: scroll.
    if (width < 601) {
      window.scrollTo(args as ScrollToOptions)
    } else {
      // account for tabs at top.
      args.top -= 60
      containerRef.current?.scrollTo(args as ScrollToOptions)
    }
  }
  const select = (index: number) => () => {
    setExpanded(index)
  }

  const creatureList = (
    <ol class={styles.creatures} ref={olRef}>
      {filteredCreatures.map((c, i) => {
        if (i === expanded) {
          return (
            <ExpandedItem
              abilityScores={abilityScores(c)}
              actions={c.Actions}
              alignment={alignment(c)}
              legendaryActions={c['Legendary Actions']}
              name={c.name}
              onAdd={() => onAddToInitiative(c)}
              onCollapse={deselect}
              physicalTraits={physicalTraits(c)}
              reactions={c.Reactions}
              scrollTo={scrollTo}
              selected={selected === i}
              shortTraits={shortTraits(c)}
              size={size(c)}
              traits={c.Traits ?? []}
              type={type(c)}
            />
          )
        }

        return (
          <ListItem
            selected={selected === i}
            key={c.name}
            onSelect={select(i)}
            title={c.name}
            subText={type(c)}
          />
        )
      })}
    </ol>
  )

  return (
    <section class={styles.container} ref={containerRef}>
      <SearchHeader
        onAdd={toggleCreating}
        onInput={compose(setSearchTerm, getInputVal)}
        searchTerm={searchTerm}
        title="Creatures"
      />

      {creating && <Create onSave={addCreature} />}

      {creatures.length === 0 ? <Loading /> : creatureList}
    </section>
  )
}

export default Creatures
