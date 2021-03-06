import React from 'react';
import TextField from '@material-ui/core/TextField';
import LockIcon from '@material-ui/icons/Lock';
import {Link} from 'react-router-dom';
import Button from '@material-ui/core/Button';
import styles from './routeStyles';
import {withStyles} from '@material-ui/core/styles/index';
import Container from '@material-ui/core/Container';
import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';
import {encodeFormData} from './functions';

class Signup extends React.Component{

    constructor(){
        super();
        this.state={
            name: "",
            physAddr: "",
            email: "",
            user: "",
            password: ""
        }
    }

    handleChange = e => {
        this.setState({[e.target.name]: e.target.value})
    }

    handleSubmit = e =>{
        const url =  process.env.REACT_APP_baseAPIURL + '/signup'
        const{name, physAddr, email, user, password} = this.state;
        let data = {
            name: name,
            email: email,
            username: user,
            address: physAddr,
            password: password
        }
        fetch( url,
            {method: 'POST',
            body: encodeFormData(data),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        })
        .then(res => res.json())
        .catch(error => console.log('Error:',error))
        .then(response => console.log ('Success:', response));
        }



    render(){
        const {classes} = this.props;
        return(
        <Container maxWidth="sm">
              <div className={classes.contentContainer}>
               <Grid container justify="center" alignItems="center">
                <Avatar className={classes.avatar}>
                    <LockIcon fontSize="large"/>
                    </Avatar>
                </Grid>
                <h2>Sign Up</h2>
                <form>
                    <div>
                        <TextField
                          label="Name"
                          name="name"
                          margin="normal"
                          variant="outlined"
                          onChange = {this.handleChange}
                          fullWidth
                        />
                    </div>
                    <div>
                        <TextField
                          label="Physical Address"
                          name="physAddr"
                          margin="normal"
                          variant="outlined"
                          onChange = {this.handleChange}
                          fullWidth
                        />
                    </div>
                     <div>
                         <TextField
                           label="E-mail Address"
                           name="email"
                           margin="normal"
                           variant="outlined"
                           type="email"
                           onChange = {this.handleChange}
                           fullWidth
                         />
                     </div>
                    <div>
                        <TextField
                          label="Username"
                          name="user"
                          margin="normal"
                          variant="outlined"
                          onChange = {this.handleChange}
                          fullWidth
                        />
                    </div>
                    <div>
                        <TextField
                          label="Password"
                          name="password"
                          margin="normal"
                          variant="outlined"
                          type="password"
                          onChange = {this.handleChange}
                          fullWidth
                        />
                    </div>
                    <Button onClick= {this.handleSubmit} variant="contained" color="primary" fullWidth>
                        Sign Up
                    </Button>
                  </form>
                <div>
                <Link to="/login" >
                     Already have an account? Sign in
                 </Link>
                 </div>
              </div>
              </Container>
        );
    }
}

export default withStyles(styles) (Signup);