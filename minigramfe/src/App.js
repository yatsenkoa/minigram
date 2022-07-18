import logo from './logo.svg';
import axios from 'axios'
import React, {Component, setState, useEffect, useState, useRef} from 'react'
import './fonts/BadMofo.ttf'
import { Box, Center, Image, Flex, Badge, Text, GridItem, Grid,
    Input,
    Stack, HStack, VStack,
    Modal,
    ModalContent,
    Button,
    useDisclosure,
    Spacer,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Container,
    ButtonGroup,
    Divider,
    IconButton,
  

  } from "@chakra-ui/react";
import {
    Search2Icon
}from "@chakra-ui/icons"

import Cookies from 'universal-cookie'

import { Routes, Route, useParams, BrowserRouter } from "react-router-dom";

const api_url = "http://localhost:3003";

const SearchBar = () => {
    return (
        <Stack spacing={4} pr='28'>
    <InputGroup>
    <InputLeftElement
      children={<Search2Icon color='gray.300' />}
    />
    <Input type='tel' placeholder='Search by @' />
    </InputGroup>
    </Stack>    
    )

}

const TopWidget = (props) => {
    return (
      <VStack
        align="space-between"
        pr='4'
        pl='4'
        borderBottom='1px solid gray'
      >
      <HStack justify='space-between'>
          <Text fontSize='5xl' id='badmofo'>minigram</Text>
          <SearchBar />
        <HStack>
            <Text>Login</Text>
        </HStack>
      </HStack>
      </VStack>
    )
}

const AddPhotoWidget = () => {
    return;
}

const Footer = () => {
    return (
        <Box as="footer" role="contentinfo" padding='12'>
        <Divider />
        <Center paddingTop='12'>
            <Text>&copy; 2022 Artem Yatsenko</Text>
        </Center>
      </Box>
  )
}

const UserWidget = (props) => {
    return(
    <Center p='8'>
    <HStack>
        <VStack>
            <Image src='/square-128.jpg' borderRadius='full' border='1px solid' />
        </VStack>
        <VStack>
            <HStack>
                <HStack pb='8'><Text fontSize='2xl' pl='4'>yatsenko</Text><Spacer pr='16'/><Button variant='link' colorScheme='messenger' onClick={props.onLogout}>Logout</Button></HStack>
            </HStack>
            <HStack>
            <p><b>3</b> posts</p>
            <p><b>27</b> followers</p>
            <p><b>93</b> following</p>
            </HStack>
        </VStack>
    </HStack>
    </Center>
    );
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const ImageFrame = (props) => {
    const { isOpen, onOpen, onClose } = useDisclosure()

    const handleDelete = (_id) => {
        onClose();
        props.deletePost(_id);
    }

    return <>
    <Box onClick={onOpen}>
        <Image src={props.src} width='256px' height='256px' border='1px solid'/>
        <p>{props.title}</p>
    </Box>
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent alignContent={'center'}>
            <span>
            <Box>
                <Image src={props.src} border='1px solid'/>
            </Box>
            <HStack pr='2' pl='2' justifyContent='space-between'>
            <Text fontSize='3xl'>{props.title}</Text>
            <Button variant='link' colorScheme='messenger' onClick={(() => handleDelete(props._id))}>Delete</Button>
            </HStack>
            </span>
            </ModalContent>
        </Modal>
    </>
}

const ImageList = (props) => {

    const deletePost = (_id) => {
        props.setLinks(props.links.filter(data => data._id != _id))
        var data = '';
        var config = {
          method: 'delete',
          url: 'http://localhost:3003/photos',
          headers: { 
            'token': props.token,
            '_id': _id
          },
          data : data
        };
        axios(config)
        .then((response) => {
            console.log(response)
        })
        .catch(function (error) {
          console.log(error);
        });
    }

    const isFirstUpdate = useRef(true);
    const apicall = async () =>  {
        var data = '';
        var config = {
          method: 'get',
          url: 'http://localhost:3003/photos',
          headers: { 
            'token': props.token
          },
          data : data
        };
        axios(config)
        .then((response) => {
            props.setLinks(response.data)
        })
        .catch(function (error) {
          console.log(error);
        });
    }

    useEffect(() => {
        if(isFirstUpdate.current && props.token != "") {
            apicall();
            isFirstUpdate.current = false;
        }
    })

    return (
        props.links == [] ? <Grid templateColumns='repeat(3, 3fr)' templateRows='repeat(3, 3fr)'>
        </Grid> :
        <Grid gap='3' templateColumns='repeat(3, 1fr)' templateRows='repeat(3, 1fr)'>
            {
                props.links.map((link, i) => {
                    console.log(link)
                    return <GridItem key={i}>
                                <ImageFrame src={'http://localhost:3003/static/' + link['name']} title={link['title']} token={props.token} _id={link._id} deletePost={deletePost} />
                           </GridItem>
                })
            }
            {
                (() => {
                    const boxes = [];
                    for (let i = 0; i < 9 - props.links.length; i++) {
                        boxes.push(<Box width='256px' height='256px' backgroundColor='gray.50' border='1px solid' ></Box>)
                    }
                    return boxes;
                })()
            }
        </Grid>
    )

}

const PublicImageFrame = (props) => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    return <>
    <Box onClick={onOpen}>
        <img src={props.src} width='256px' height='256px'/>
        <p>{props.title}</p>
    </Box>
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent alignContent={'center'}>
            <span>
            <Box>
                <Image src={props.src}/>
            </Box>
            <HStack pr='2' pl='2' justifyContent='space-between'>
            <Text fontSize='3xl'>{props.title}</Text>
            </HStack>
            </span>
            </ModalContent>
        </Modal>
    </>
}

const PublicImageList = () => {
    let params = useParams();
    const [links, setLinks] = useState([]);
    const isFirstUpdate = useRef(true);

    const apicall = async () =>  {
        var data = '';
        var config = {
          method: 'get',
          url: 'http://localhost:3003/photos/' + params.username,
          headers: { 
            '_username': params.username
          },
          data : data
        };
        axios(config)
        .then((response) => {
            console.log(response)
            setLinks(response.data)
        })
        .catch(function (error) {
          console.log(error);
        });
    }

    useEffect(() => {
        if(isFirstUpdate.current){
            apicall();
            isFirstUpdate.current = false;
        }
    }, [])

    return (
        links == [] ? <Grid  templateColumns='repeat(3, 3fr)' templateRows='repeat(3, 3fr)'>
        </Grid> :
        <Grid gap='3' templateColumns='repeat(3, 1fr)' templateRows='repeat(3, 1fr)'>
            {
                links.map((link, i) => {
                    return <GridItem key={i}>
                                <PublicImageFrame src={'http://localhost:3003/static/' + link['name']} title={link['title']} _username={link._username}/>
                           </GridItem>
                })
            }
            {
                (() => {
                    const boxes = [];
                    for (let i = 0; i < 9 - links.length; i++) {
                        boxes.push(<Box width='256px' height='256px' backgroundColor='gray.50' ></Box>)
                    }
                    return boxes;
                })()
            }
        </Grid>
    )

}


const App = () => {

    const [file, setFile] = useState(null);
    const [title, setTitle] = useState("");
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [token, setToken] = useState("");
    const [logged_in, setLoggedIn] = useState(false);
    const [links, setLinks] = useState([]);
    const [signup_user, setSignupUser] = useState("");
    const [signup_pass, setSignupPass] = useState("");
    const [got_token, setGotToken] = useState(false);
    const [filename, setFilename] = useState("");

    const cookies = new Cookies();

    const killState = () => {
        setFile(null);
        setTitle("");
        setUser("");
        setPass("");
        setToken("");
        setLoggedIn(false);
        setLinks([]);
        setSignupUser("");
        setSignupPass("");
        setGotToken(false);
    }

    useEffect(() => {
        if(got_token == false) {
            getCookie()
        }
    }, [])

    const onFileChange = async (event) => {
        await setFile(event.target.files[0])
    }

    const onTextChange = async event => {
        await setTitle(event.target.value)
    }

    const onUserChange = async event => {
        await setUser(event.target.value)
    }

    const onPassChange = async event => {
        await setPass(event.target.value)
    }

    const onSignupUserChange = async event => {
        await setSignupUser(event.target.value)
    }

    const onSignupPassChange = async event => {
        await setSignupPass(event.target.value)
    }

    const links_apicall = async () =>  {
        var data = '';
        var config = {
          method: 'get',
          url: 'http://localhost:3003/photos',
          headers: { 
            'token': token
          },
          data : data
        };
        axios(config)
        .then((response) => {
            console.log(response.data)
            setLinks(response.data)
        })
        .catch(function (error) {
          console.log(error);
        });
    }

    const onUpload = async event => {

        if(file != null) {
            event.preventDefault()
            const formData = new FormData()
            formData.append(
                "file", 
                file,
                file.name
            )
            formData.append(
                "title",
                title
            )
            let config = {
                method: 'post',
                url: 'http://localhost:3003/auth',
                headers: { 
                    'token': token
                },
            }
            await axios.post(api_url + "/photos", formData, config)

            setTitle("")
            setFile(null)
            setFilename("");

            links_apicall()
        }
        else {
            console.log("file is null!")
        }
    }

    const setCookie = async (token) => {
        await cookies.set('token', token)
    }

    const getCookie = async () => {
        const _token = await cookies.get('token')
        if(_token == undefined) {
            return false;
        }
        else {
            await setToken(_token);
            await setLoggedIn(true);
            return true;
        }
    }

    const onLogin = async event => {
        if(user != null && pass != null) {
            event.preventDefault()
            var config = {
                method: 'post',
                url: 'http://localhost:3003/auth',
                headers: { 
                    'user': user,
                    'pass': pass
                },
              };
            const response = await axios(config);
            const token = response.data;
            await setCookie(token);
            await setToken(token)
            await setLoggedIn(true)
            }
            else {
                console.log("file is null!")
            }
    }

    const onLogout = () => {
        killState()
        cookies.remove('token')
        setLoggedIn(false)
    }

    const onSignup = async event => {
        if(signup_user != null && signup_pass != null) {
            event.preventDefault()
            var config = {
                method: 'post',
                url: 'http://localhost:3003/user/create',
                headers: { 
                    'user': signup_user, 
                    'pass': signup_pass
                },
              };
            const response = await axios(config);
            const token = response.data;
            await this.setCookie(token);
            await setToken(token)
            await setLoggedIn(true)
            }
            else {
                console.log("file is null!")
            }
        }

        return (
            <Box className="App" width='100vw'>
                <BrowserRouter>
                <header className="App-header" width='100vw'>
                    <TopWidget />
                    <Center >
                    <VStack>
                    {
                        logged_in ? <></> : <Box><p>Log In</p>
                        <form>
                            <input type='text' placeholder='username' value={user} onChange={onUserChange}/>
                            <input type='password' placeholder='password' value={pass} onChange={onPassChange}/>
                            <Button variant='link' colorScheme='messenger' onClick={onLogin}>Login</Button>
                        </form>
                        <hr /><p href='/signup'>Sign up</p>
                        <form>
                            <input type='text' placeholder='username' value={signup_user} onChange={onSignupUserChange}/>
                            <input type='password' placeholder='password' value={signup_pass} onChange={onSignupPassChange}/>
                            <Button variant='link' colorScheme='messenger' onClick={onSignup}>Signup</Button>
                        </form>
                        </Box>
                    }
                    <Routes>
                    <Route path='/' element=
                    {
                        logged_in ?
                        <Box>
                        <UserWidget onLogout={onLogout}/>
                        <Box>
                            <ImageList token={token} links={links} setLinks={setLinks} />
                        </Box>
                            <Text>
                                Choose an image
                            </Text>
                        <Center>
                            <input onChange={onFileChange} name="file" type="file" />
                        </Center>

                        <p>
                            Choose the title
                        </p>
                        <Center>
                            <Input onChange={onTextChange} value={title} name="text" type="text:" />
                        </Center>
                        <Center pb='8'>
                            <Input onClick={onUpload} type="submit" />
                        </Center>
                        </Box>
                     : <Box></Box>
                    }>
                    </Route>

                    <Route path=':username' element={<PublicImageList />} >
                    </Route>

                    </Routes>
                    </VStack>
                    </Center>
                        
                </header>
                </BrowserRouter>
                <Footer />
            </Box>
        );
}

export default App;
