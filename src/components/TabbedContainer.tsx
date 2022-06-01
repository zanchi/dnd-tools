import cx from 'classnames'
import { FunctionalComponent as FC } from 'preact'

import styles from './TabbedContainer.module.scss'

type Props = {
  currentTab: number
  children: (JSX.Element | false)[]
  onChange: (i: number) => unknown
  tabs: Tab[]
}

type Tab = {
  name: string
}

type TabsProps = {
  currentTab: number
  onChange: (i: number) => unknown
  tabs: Tab[]
}

const Tabs: FC<TabsProps> = ({ currentTab, onChange, tabs }) => (
  <nav class={styles.nav}>
    <ol class={styles.tabs}>
      {tabs.map((tab, i) => (
        <li
          class={cx(styles.tab, i === currentTab && styles.selectedTab)}
          onClick={() => onChange(i)}
        >
          {tab.name}
        </li>
      ))}
    </ol>
  </nav>
)

const TabbedContainer: FC<Props> = ({ children, ...rest }) => {
  return (
    <div class={styles.container}>
      <Tabs {...rest} />
      {children?.find((t, i) => i === rest.currentTab)}
    </div>
  )
}

export default TabbedContainer
