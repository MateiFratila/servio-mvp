import { useSelector } from 'react-redux'
import { selectLanguage } from '../features/lang/langSlice'
import { LABELS } from './labels'

export function useLabels() {
  const lang = useSelector(selectLanguage)
  return LABELS[lang]
}
