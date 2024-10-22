import { useSearchParams } from 'next/navigation'

interface SearchParamsWrapperProps {
  children: (searchParams: URLSearchParams) => React.ReactNode
}

export default function SearchParamsWrapper({ children }: SearchParamsWrapperProps) {
  const searchParams = useSearchParams()
  return <>{children(searchParams)}</>
}