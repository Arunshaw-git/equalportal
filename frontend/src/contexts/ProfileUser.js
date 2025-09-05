const {useContext,createContext,useState} = require("react");

const ProfileUserContext = createContext();

export const useProfileUser = () => useContext(ProfileUserContext);

export const UserProvider = ({children}) => {
    const [profileUser, setProfileUser] = useState({});

    return(
       <ProfileUserContext.Provider value={{profileUser, setProfileUser}}>
            {children}
        </ProfileUserContext.Provider>
        
    )


}