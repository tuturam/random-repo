import { useEffect, useRef, useState } from 'react'
import { ArrowRightIcon, CaretSortIcon, CheckIcon, GitHubLogoIcon, QuestionMarkCircledIcon, StarFilledIcon } from '@radix-ui/react-icons'
import './App.css'
import './github-lang-color.css'
import { useTheme } from './components/theme-provider'
import { Switch } from './components/ui/switch'
import { cn, dataLanguage, LanguageSelectItems, languagesType } from './lib/utils'
import { Popover, PopoverContent, PopoverTrigger,  } from './components/ui/popover'
import { Button } from './components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './components/ui/command'
import { FixedSizeList } from 'react-window'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card'
import { GitForkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from './components/ui/sonner'

function App() {
  const { setTheme, theme } = useTheme()
  const [loadingState, setLoadingState] = useState({
    loadError: false,
    loadSuccess: false,
    loadDataSelect: false,
    disableLimit: false
  })
  const [stateText, setStateText] = useState('')
  const [languages, setLanguages] = useState<languagesType>([])
  const [dataGithubSelect, setDataGithubSelect] = useState<LanguageSelectItems>()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const abortControllerRef = useRef(null);

  const getDataLanguage = async () => {
    setLoadingState({ ...loadingState, loadDataSelect: true })
    setStateText('Loading languages...')
    try {
      const data: languagesType = dataLanguage()
      const filteredData = data.filter((language) => language.value !== "")
      setLanguages(filteredData)
    } catch (error) {
      console.error("Error fetching languages:", error)
    } finally {
      setLoadingState((prevState) => ({ ...prevState, loadDataSelect: false }))
      setStateText('Please select a language')
    }
  }

  const getDataGithubLanguage = async ({param, type}: {param: string, type?: string}, abortControllerRef: React.MutableRefObject<AbortController | null>) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
  }

  // Buat AbortController baru
  const controller = new AbortController();
  abortControllerRef.current = controller;  // Simpan controller untuk request ini
  const signal = controller.signal;
    if (type === 'query') {
      setStateText('Loading, please wait...')
      setLoadingState({ ...loadingState, loadSuccess: false, loadDataSelect: true, loadError: false })
      const randomPage = Math.floor(Math.random() * 1000) - 1
      try {
        const response = await fetch(`https://api.github.com/search/repositories?q=language:${param}&per_page=1&page=${randomPage}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            },
            signal
          },
        );
        if (!response.ok) {
          setLoadingState({ ...loadingState, loadError: true, loadSuccess: false })
          setStateText('Error fetching repositories')
          if (response.status === 403) {
            toast("Limit reached!", {
              description: "Please try again a few second later",
              position: "bottom-center",
              className: "text-start",
              action: {
                label: 'Dismiss',
                onClick: () => toast.dismiss(),
              },
            })
          }
        }
        else if (response.ok) {
          const data = await response.json();
          setLoadingState({ ...loadingState, loadSuccess: true, loadError: false })
          setDataGithubSelect(data.items[0])
        }
      } catch (error) {
        console.error("Error fetching languages:", error);
        setLoadingState({ ...loadingState, loadError: true, loadSuccess: false })
        setStateText('Error fetching repositories')
      }
    }
  };

  const filteredLanguages = languages.filter((lang) =>
    lang.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    getDataLanguage()
  }, [])

  return (
    <div className='flex flex-col gap-3'>
      <div className="flex items-center gap-5">
        <GitHubLogoIcon className="w-10 h-10" />
        <h1>Random Github Finder</h1>
      </div>
      <div className="flex flex-col gap-3 items-center">
      <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild disabled={loadingState.loadDataSelect || loadingState.disableLimit}>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {value
                ? languages.find((lang) => lang.value === value)?.value
                : "Select languages..."}
              <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="md:w-80 w-full p-1">
            <Command>
              <CommandInput placeholder="Search languages..." className="h-9" value={searchTerm} onValueChange={(value) => setSearchTerm(value)} />
              <CommandList>
                <CommandEmpty>No language found.</CommandEmpty>
                <CommandGroup>
                  <FixedSizeList
                    height={275}
                    itemCount={filteredLanguages.length}
                    itemSize={40}
                    width="100%"
                    className='scroll-hidden'
                  >
                  {({ index, style }) => {
                    const lang = filteredLanguages[index]
                    return (
                      <CommandItem
                        key={lang.value}
                        value={lang.value}
                        onSelect={(currentValue) => {
                          setValue(currentValue === value ? "" : currentValue)
                          setOpen(false)
                          getDataGithubLanguage(currentValue !== value ? {param: currentValue, type: 'query'} : {param: currentValue}, abortControllerRef)
                        }}
                        style={style}
                      >
                        {lang.title}
                        <CheckIcon
                          className={cn(
                            "ml-auto h-4 w-4",
                            value === lang.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    )
                  }}
                  </FixedSizeList>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {loadingState.loadSuccess ? (
          <a href={dataGithubSelect?.html_url} target="_blank" rel="noreferrer" className="w-full group">
            <Card>
              <CardHeader className='relative'>
                <CardTitle>{dataGithubSelect?.name}</CardTitle>
                <CardDescription>{dataGithubSelect?.description ? dataGithubSelect?.description : 'No description'}</CardDescription>
                <ArrowRightIcon className="w-4 h-4 absolute top-1 right-3 group-hover:-rotate-45 duration-200" />
              </CardHeader>
              <CardFooter>
                <div className="flex items-center gap-3 justify-between w-full">
                    <small className='gap-0.5 flex items-baseline'>
                      <div className={`rounded-full w-2 h-2 self-auto ${dataGithubSelect?.language}`}></div>
                      <small className='truncate opacity-50'>{dataGithubSelect?.language}</small>
                    </small>
                    <small className="flex items-center gap-0.5">
                      <StarFilledIcon className="w-3 h-3" />
                      <small className='opacity-50 truncate'>{dataGithubSelect?.stargazers_count.toLocaleString('id-ID', {maximumFractionDigits: 0}).replace(/\./g, ',')}</small>
                    </small>
                    <small className="flex items-center gap-0.5">
                      <GitForkIcon className="w-3 h-3" />
                      <small className='opacity-50 truncate'>{dataGithubSelect?.forks_count.toLocaleString('id-ID', {maximumFractionDigits: 0}).replace(/\./g, ',')}</small>
                    </small>
                    <small className="flex items-center gap-0.5">
                      <QuestionMarkCircledIcon className="w-3 h-3" />
                      <small className='opacity-50 truncate'>{dataGithubSelect?.open_issues_count.toLocaleString('id-ID', {maximumFractionDigits: 0}).replace(/\./g, ',')}</small>
                    </small>
                </div>
              </CardFooter>
            </Card>
          </a>
        ) : (
          <div className={`${loadingState.loadError ? 'dark:bg-red-800 bg-red-500/50' : 'bg-neutral-200 dark:bg-neutral-800' } h-20 md:h-32 w-60 md:w-80 rounded-lg flex justify-center items-center text-sm md:text-base flex-wrap`}>
            <span>{stateText}</span>
          </div>
        )}
        {loadingState.loadSuccess && !loadingState.loadError && (
          <Button
            disabled={loadingState.disableLimit}
            variant="outline"
            className="w-full"
            onClick={() => {
              getDataGithubLanguage({param: value, type: 'query'}, abortControllerRef)
            }}
          >
            Refresh
          </Button>
        )}
        {loadingState.loadError && !loadingState.loadSuccess && (
          <Button
            disabled={loadingState.disableLimit}
            variant="outline"
            className={`w-full ${loadingState.loadError ? 'dark:bg-red-800 bg-red-500/50' : 'bg-neutral-200 dark:bg-neutral-800'}`}
            onClick={() => {
              getDataGithubLanguage({param: value, type: 'query'}, abortControllerRef)
            }}
          >
            Click to retry
          </Button>
        )}
        <Switch
          checked={theme === 'dark'}
          onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
      </div>
      <Toaster />
    </div>
  )
}

export default App
